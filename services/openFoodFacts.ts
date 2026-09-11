/**
 * Open Food Facts — base aberta de produtos, consultada por código de barras.
 *
 * Gratuita e feita para ser reusada (licença ODbL). Duas obrigações:
 *  - User-Agent próprio identificando o app. É basicamente toda a política
 *    de rate limit deles; sem isso a requisição pode ser recusada.
 *  - Atribuição onde o dado aparece (ver `OPEN_FOOD_FACTS_CREDIT`).
 *
 * Dá nome, marca e tamanho da embalagem. NÃO dá preço — preço vem do
 * histórico da própria família (`usePriceHistory`).
 *
 * Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
 */

import type { ShoppingUnit } from '@/types/database';

const BASE = 'https://world.openfoodfacts.org/api/v2';
const USER_AGENT = 'ZagoApp/1.0 (aplicativo familiar de lista de compras)';
const TIMEOUT_MS = 8000;

export const OPEN_FOOD_FACTS_CREDIT = 'Dados de produto: Open Food Facts (ODbL)';

export interface ProductLookup {
  gtin: string;
  name: string;
  brand: string | null;
  /** Quantidade da embalagem, quando o registro traz algo interpretável. */
  quantity: number | null;
  unit: ShoppingUnit | null;
}

/** Só dígitos, 8 a 14 — os formatos de EAN/UPC/GTIN que existem. */
export function isValidGtin(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 14;
}

export function normalizeGtin(raw: string): string {
  return raw.replace(/\D/g, '');
}

/**
 * Interpreta o campo livre de quantidade do Open Food Facts ('5 kg',
 * '500g', '1,5 L'). Devolve null quando não dá para confiar — melhor
 * deixar a pessoa preencher do que inventar um número errado.
 */
function parsePackageSize(raw: string | undefined): { quantity: number; unit: ShoppingUnit } | null {
  if (!raw) return null;
  const match = raw.trim().match(/^([\d]+(?:[.,][\d]+)?)\s*(kg|g|l|ml|un)\b/i);
  if (!match) return null;

  const quantity = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(quantity) || quantity <= 0) return null;

  const unitMap: Record<string, ShoppingUnit> = {
    kg: 'kg',
    g: 'g',
    l: 'L',
    ml: 'ml',
    un: 'un',
  };
  const unit = unitMap[match[2].toLowerCase()];
  if (!unit) return null;

  return { quantity, unit };
}

/**
 * Busca um produto pelo código de barras.
 *
 * Devolve `null` quando o produto não existe na base, quando a rede falha
 * ou quando estoura o tempo — quem chama trata os três casos igual: segue
 * com o preenchimento manual, sem travar o cadastro.
 */
export async function lookupByGtin(rawGtin: string): Promise<ProductLookup | null> {
  const gtin = normalizeGtin(rawGtin);
  if (!isValidGtin(gtin)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const fields = 'code,product_name,product_name_pt,brands,quantity';
    const response = await fetch(`${BASE}/product/${gtin}.json?fields=${fields}`, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const body = await response.json();
    if (body?.status !== 1 || !body?.product) return null;

    const product = body.product;
    const name: string = (product.product_name_pt || product.product_name || '').trim();
    if (!name) return null;

    const size = parsePackageSize(product.quantity);

    return {
      gtin,
      name,
      brand: typeof product.brands === 'string' && product.brands.trim()
        ? product.brands.split(',')[0].trim()
        : null,
      quantity: size?.quantity ?? null,
      unit: size?.unit ?? null,
    };
  } catch {
    // Rede fora, timeout ou JSON inesperado — o cadastro manual continua.
    return null;
  } finally {
    clearTimeout(timer);
  }
}

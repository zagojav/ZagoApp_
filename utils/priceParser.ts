// Extração de nome + preço a partir do texto cru que o OCR devolve pra uma
// foto de etiqueta de mercado (hoje o ML Kit, rodando no próprio aparelho).
//
// Tudo aqui é HEURÍSTICA e serve só pra pré-preencher o formulário — a tela de
// confirmação sempre deixa o usuário corrigir. Etiqueta de mercado tem fonte
// pequena, reflexo de plástico e foto torta; errar às vezes é o esperado.

/**
 * Palavras de etiqueta: indicam que a linha é preço, promoção ou código —
 * não o nome do produto. Cada ocorrência derruba a pontuação da linha.
 */
const LABEL_NOISE_WORDS = [
  'r$', 'rs', 'preco', 'preço', 'oferta', 'promocao', 'promoção', 'desconto',
  'avista', 'cada', 'unidade', 'unid', 'un', 'kg', 'g',
  'validade', 'venc', 'codigo', 'código', 'cod', 'ean', 'ref', 'sku',
  'leve', 'pague', 'economize', 'clube', 'cartao', 'cartão', 'socio', 'sócio',
  'apenas', 'so', 'só', 'ate', 'até',
  'atacado', 'varejo', 'atacarejo', 'limite', 'peca', 'peça', 'pecas', 'peças',
];

/**
 * Conectivos que aparecem *dentro* de nomes de produto ("Filé DE Frango",
 * "Doce DE Leite", "Leite COM Aveia").
 *
 * Ficam separados das palavras de etiqueta porque são neutros: não acrescentam
 * substância pro nome — então não contam como palavra significativa — mas
 * também não são indício de que a linha seja ruído, então não penalizam.
 * Tratá-los como ruído fazia "FILE DE FRANGO" perder pra "BANDEJA 500G".
 */
const CONNECTOR_WORDS = [
  'de', 'do', 'da', 'dos', 'das', 'com', 'sem', 'e', 'ou',
  'em', 'no', 'na', 'nos', 'nas', 'ao', 'aos', 'a', 'o', 'os', 'as',
  'por', 'para', 'pra',
];

/** Linha que é claramente um código de barras / código interno, não um nome. */
function isCodeLine(line: string): boolean {
  const digitsOnly = line.replace(/\D/g, '');
  // EAN-8/EAN-13 e códigos internos longos.
  if (digitsOnly.length >= 8 && digitsOnly.length / line.length > 0.7) return true;
  return /^(cod|código|codigo|ean|ref|sku)\b/i.test(line.trim());
}

/** Proporção de caracteres alfabéticos — nome de produto é majoritariamente letra. */
function letterRatio(line: string): number {
  const letters = (line.match(/\p{L}/gu) ?? []).length;
  return line.length === 0 ? 0 : letters / line.length;
}

function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

/** Unidades de medida que a etiqueta cola (ou não) no número. */
const UNIT_SUFFIXES = 'kg|g|mg|ml|l|lt|un|und|unid|pct|cx|dz';

/**
 * Forma canônica usada pra decidir se dois nomes são "o mesmo produto":
 * minúsculo, sem acento, sem pontuação, espaços colapsados.
 *
 * Gramatura é normalizada junto porque o OCR alterna livremente entre
 * "5KG", "5 kg" e "5 Kg" pro mesmo produto — sem isso os dois viram
 * conjuntos de palavras diferentes e o match falha por pouco.
 */
export function normalizeProductName(name: string): string {
  return stripAccents(name)
    .toLowerCase()
    // "1,5" e "1.5" viram "15": um número só, não duas palavras.
    .replace(/(\d)[,.](\d)/g, '$1$2')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    // "5 kg" -> "5kg", pra casar com quem escreveu junto.
    .replace(new RegExp(`(\\d)\\s+(${UNIT_SUFFIXES})\\b`, 'g'), '$1$2');
}

export interface PriceCandidate {
  /** Valor em reais, já convertido pra número. */
  value: number;
  /** Trecho exato do OCR que gerou esse candidato — mostrado como pista na UI. */
  raw: string;
  /** Quanto maior, mais provável que seja o preço principal da etiqueta. */
  score: number;
}

export interface ParsedPriceLabel {
  productName: string;
  price: number | null;
  /** Todos os preços plausíveis achados, do mais provável pro menos. */
  priceCandidates: PriceCandidate[];
  /** Linhas que sobraram como alternativas de nome, do mais provável pro menos. */
  nameCandidates: string[];
}

// Um preço vale entre R$0,01 e R$9.999,99. Fora disso é ruído de OCR
// (código, gramatura, telefone da loja).
const MIN_PRICE = 0.01;
const MAX_PRICE = 9999.99;

/**
 * Varre o texto atrás de todo número que pareça um preço.
 *
 * Cobre três formas: com `R$` na frente (`R$ 24,90`), solto (`24,90`), e o
 * caso em que o OCR perdeu a vírgula porque na etiqueta os centavos vêm em
 * fonte menor e sobrescrita (`R$ 24 90`).
 */
function findPriceCandidates(lines: string[]): PriceCandidate[] {
  const candidates: PriceCandidate[] = [];

  lines.forEach((line, lineIndex) => {
    const lower = stripAccents(line.toLowerCase());
    // `(?!\d)` impede que "12,345" (um código) vire o preço "12,34".
    const pattern = /(R\$\s*)?(\d{1,4})\s*[,.]\s*(\d{2})(?!\d)|(R\$\s*)(\d{1,4})\s+(\d{2})(?!\d)/gi;

    for (const match of line.matchAll(pattern)) {
      const hasCurrency = Boolean(match[1] ?? match[4]);
      const reais = match[2] ?? match[5];
      const centavos = match[3] ?? match[6];
      const value = Number(`${reais}.${centavos}`);

      if (!Number.isFinite(value) || value < MIN_PRICE || value > MAX_PRICE) continue;

      let score = 0;
      // "R$" na frente é o sinal mais forte de que aquilo é um preço.
      if (hasCurrency) score += 10;
      // Etiqueta põe o preço principal no topo; preço por kg/unidade vem depois.
      score += Math.max(0, 5 - lineIndex);
      // Marcadores do preço de venda principal.
      if (/(a vista|avista|cada|por|apenas)/.test(lower)) score += 3;
      // Preço por unidade de medida costuma ser secundário na etiqueta.
      if (/(por\s*kg|\/\s*kg|por\s*litro|\/\s*l\b|por\s*100\s*g)/.test(lower)) score -= 6;
      // Preço de clube/cartão não é o que a família paga por padrão.
      if (/(clube|cartao|socio|atacado|leve|pague)/.test(lower)) score -= 4;

      candidates.push({ value, raw: match[0].trim(), score });
    }
  });

  // Dedup por valor, mantendo a melhor pontuação de cada um.
  const byValue = new Map<number, PriceCandidate>();
  for (const candidate of candidates) {
    const existing = byValue.get(candidate.value);
    if (!existing || candidate.score > existing.score) byValue.set(candidate.value, candidate);
  }

  return [...byValue.values()].sort((a, b) => b.score - a.score);
}

/**
 * Escolhe as linhas que parecem nome de produto.
 *
 * A regra "primeira linha = nome" erra muito: etiqueta costuma começar com
 * o preço grande, ou com "OFERTA". Então pontuamos cada linha por quanto ela
 * *parece* um nome e devolvemos as melhores.
 */
function findNameCandidates(lines: string[]): string[] {
  const scored = lines
    .map((line, index) => {
      const trimmed = line.trim();
      const normalized = normalizeProductName(trimmed);

      if (normalized.length < 3) return null;
      if (isCodeLine(trimmed)) return null;
      // Linha que é só preço/número não é nome.
      if (letterRatio(trimmed) < 0.4) return null;

      const words = normalized.split(' ');
      const noise = words.filter((w) => LABEL_NOISE_WORDS.includes(w));
      // Conectivo não conta como substância, mas também não conta contra.
      const meaningful = words.filter(
        (w) => !LABEL_NOISE_WORDS.includes(w) && !CONNECTOR_WORDS.includes(w) && !/^\d+$/.test(w)
      );
      if (meaningful.length === 0) return null;

      let score = 0;
      // Nome de produto tem substância: "Arroz Tio João 5kg" > "OFERTA".
      score += Math.min(meaningful.length, 5) * 2;
      score += Math.min(trimmed.length, 40) / 10;
      // Quanto mais alto na etiqueta, mais provável ser o nome.
      score += Math.max(0, 4 - index);
      // Penaliza linha dominada por ruído de etiqueta.
      score -= noise.length * 2;
      // Etiqueta escreve o produto em CAIXA ALTA na maioria das vezes.
      if (trimmed === trimmed.toUpperCase() && letterRatio(trimmed) > 0.6) score += 2;

      return { line: trimmed, score };
    })
    .filter((entry): entry is { line: string; score: number } => entry !== null)
    .sort((a, b) => b.score - a.score);

  // A mesma linha pode chegar duas vezes (o OCR devolve os blocos separados
  // e também o texto inteiro) — mantém só a melhor pontuação de cada uma.
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const entry of scored) {
    const key = normalizeProductName(entry.line);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(titleCase(entry.line));
  }

  return unique;
}

/**
 * Etiqueta vem em CAIXA ALTA; "Arroz Tio João 5Kg" lê melhor na lista que
 * "ARROZ TIO JOÃO 5KG". Preserva siglas curtas e unidades coladas no número.
 */
function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(/(\s+)/)
    .map((word) => {
      if (!word.trim()) return word;
      // Mantém "5kg", "1,5l", "500g" como estão.
      if (/^\d/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
}

export function parsePriceLabel(rawText: string): ParsedPriceLabel {
  const lines = (rawText ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const priceCandidates = findPriceCandidates(lines);
  const nameCandidates = findNameCandidates(lines);

  return {
    productName: nameCandidates[0] ?? '',
    price: priceCandidates[0]?.value ?? null,
    priceCandidates,
    nameCandidates,
  };
}

/**
 * Similaridade 0..1 entre dois nomes já normalizados, por sobreposição de
 * palavras (índice de Dice). Escolhido em vez de distância de edição porque
 * o que muda entre dois scans do mesmo produto costuma ser palavra inteira
 * faltando ("Arroz Tio João" vs "Arroz Tio João 5kg"), não letra trocada.
 */
export function nameSimilarity(a: string, b: string): number {
  const tokensA = new Set(normalizeProductName(a).split(' ').filter(Boolean));
  const tokensB = new Set(normalizeProductName(b).split(' ').filter(Boolean));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let shared = 0;
  for (const token of tokensA) if (tokensB.has(token)) shared++;

  return (2 * shared) / (tokensA.size + tokensB.size);
}

/**
 * Acima disso dois nomes são tratados como o mesmo produto e o preço novo
 * entra no item existente em vez de criar um duplicado.
 *
 * 0.72 exige praticamente todas as palavras em comum: "Arroz Tio João 5kg" x
 * "Arroz Tio João" casa (0.86), mas "Arroz Tio João 5kg" x "Arroz Camil 5kg"
 * não (0.5) — errar pra separado é barato (dois itens na lista), errar pra
 * junto sobrescreve o preço do produto errado.
 */
export const NAME_MATCH_THRESHOLD = 0.72;

export interface ProductMatch<T> {
  item: T;
  similarity: number;
}

/** O item existente mais parecido com `name`, ou null se nenhum passa do corte. */
export function findMatchingProduct<T extends { productName: string }>(
  name: string,
  items: T[],
  threshold: number = NAME_MATCH_THRESHOLD
): ProductMatch<T> | null {
  let best: ProductMatch<T> | null = null;

  for (const item of items) {
    const similarity = nameSimilarity(name, item.productName);
    if (similarity >= threshold && (!best || similarity > best.similarity)) {
      best = { item, similarity };
    }
  }

  return best;
}

/**
 * Converte o que o usuário digitou no campo de preço pra número.
 * Aceita "24,90", "24.90", "R$ 24,90" e "2490" (→ 24,90, como teclado de PDV).
 */
export function parsePriceInput(input: string): number | null {
  const cleaned = input.replace(/[^\d,.]/g, '').trim();
  if (!cleaned) return null;

  // Último separador manda: "1.234,56" → 1234.56, "1,234.56" → 1234.56
  const lastSeparator = Math.max(cleaned.lastIndexOf(','), cleaned.lastIndexOf('.'));
  let value: number;

  if (lastSeparator === -1) {
    value = Number(cleaned);
  } else {
    const integerPart = cleaned.slice(0, lastSeparator).replace(/[,.]/g, '');
    const decimalPart = cleaned.slice(lastSeparator + 1).replace(/[,.]/g, '');
    value = Number(`${integerPart || '0'}.${decimalPart}`);
  }

  if (!Number.isFinite(value) || value < MIN_PRICE || value > MAX_PRICE) return null;
  return Math.round(value * 100) / 100;
}

/** R$ 24,90 */
export function formatPrice(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

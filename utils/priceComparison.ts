// Cálculos de "onde está mais barato" a partir dos preços já salvos.
//
// Separado do hook de propósito: são funções puras, sem Firestore no meio,
// então dá pra exercitá-las direto em Node sem subir app nem emulador.

import type { MarketPrice, PriceItem } from '@/types/database';

export interface MarketGroup {
  marketId: string;
  marketName: string;
  entries: {
    item: PriceItem;
    price: number;
    /** Nenhum outro mercado tem esse produto mais barato. */
    isCheapest: boolean;
  }[];
  total: number;
}

/** O menor preço registrado de um item, ou null se não há nenhum. */
export function cheapestPrice(item: PriceItem): MarketPrice | null {
  if (item.prices.length === 0) return null;
  return item.prices.reduce((min, price) => (price.price < min.price ? price : min));
}

/**
 * Os preços reagrupados por mercado — é assim que a lista principal mostra,
 * porque a pergunta prática é "o que eu sei sobre essa loja".
 */
export function groupByMarket(items: PriceItem[]): MarketGroup[] {
  const groups = new Map<string, MarketGroup>();

  for (const item of items) {
    const cheapest = cheapestPrice(item);

    for (const price of item.prices) {
      let group = groups.get(price.marketId);
      if (!group) {
        group = { marketId: price.marketId, marketName: price.marketName, entries: [], total: 0 };
        groups.set(price.marketId, group);
      }

      group.entries.push({
        item,
        price: price.price,
        // Empate conta como mais barato pros dois: não faz sentido apontar
        // um "vencedor" arbitrário entre dois preços iguais.
        isCheapest: cheapest !== null && price.price <= cheapest.price,
      });
      group.total += price.price;
    }
  }

  for (const group of groups.values()) {
    group.entries.sort((a, b) => a.item.productName.localeCompare(b.item.productName, 'pt-BR'));
  }

  return [...groups.values()].sort((a, b) => a.marketName.localeCompare(b.marketName, 'pt-BR'));
}

export interface PriceComparison {
  item: PriceItem;
  cheapest: MarketPrice;
  mostExpensive: MarketPrice;
  savings: number;
}

/**
 * Só os itens com preço em mais de um mercado — nos outros não há o que
 * comparar, e listá-los com "economia R$ 0,00" só faria ruído.
 */
export function getComparisons(items: PriceItem[]): PriceComparison[] {
  return items
    .filter((item) => item.prices.length > 1)
    .map((item) => {
      const sorted = [...item.prices].sort((a, b) => a.price - b.price);
      const cheapest = sorted[0];
      const mostExpensive = sorted[sorted.length - 1];
      return {
        item,
        cheapest,
        mostExpensive,
        savings: Math.round((mostExpensive.price - cheapest.price) * 100) / 100,
      };
    })
    .filter((comparison) => comparison.savings > 0)
    .sort((a, b) => b.savings - a.savings);
}

/** Soma de tudo que dá pra economizar comprando cada item onde é mais barato. */
export function totalPotentialSavings(comparisons: PriceComparison[]): number {
  return Math.round(comparisons.reduce((sum, c) => sum + c.savings, 0) * 100) / 100;
}

/**
 * Mercados conhecidos e como abrir a busca de um produto em cada um.
 *
 * O handoff não raspa nada: monta a URL de busca e entrega para o
 * `Linking.openURL`, que abre o app ou o site do mercado no navegador da
 * própria pessoa. Quem faz a requisição é ela, como se tivesse digitado.
 *
 * ⚠️ CONFIRA UMA VEZ: os templates abaixo seguem o padrão de busca do VTEX
 * (plataforma que Carrefour e Atacadão usam), mas não deu para validar de
 * fora — os sites respondem 403 para requisição automatizada. Se algum
 * abrir na home em vez da busca, é só corrigir o `searchUrl` aqui: faça a
 * busca no site pelo celular, copie a URL e troque o termo por `{q}`.
 */

export interface Market {
  id: string;
  name: string;
  /** Template da URL de busca. `{q}` vira o termo já codificado. */
  searchUrl: string;
  /** Cor da marca, usada nos chips e no agrupamento. */
  color: string;
  onColor: string;
}

export const MARKETS: Market[] = [
  {
    id: 'assai',
    name: 'Assaí',
    searchUrl: 'https://www.assai.com.br/s?q={q}',
    color: '#B8121B',
    onColor: '#FFFFFF',
  },
  {
    id: 'atacadao',
    name: 'Atacadão',
    searchUrl: 'https://www.atacadao.com.br/s?q={q}',
    color: '#004B93',
    onColor: '#FFFFFF',
  },
  {
    id: 'carrefour',
    name: 'Carrefour',
    searchUrl: 'https://mercado.carrefour.com.br/s?q={q}',
    color: '#0A5EB0',
    onColor: '#FFFFFF',
  },
  {
    id: 'paodeacucar',
    name: 'Pão de Açúcar',
    searchUrl: 'https://www.paodeacucar.com/busca?terms={q}',
    color: '#00764B',
    onColor: '#FFFFFF',
  },
  {
    id: 'tenda',
    name: 'Tenda',
    searchUrl: 'https://www.tendaatacado.com.br/busca?q={q}',
    color: '#E2231A',
    onColor: '#FFFFFF',
  },
];

export const MARKET_BY_NAME: Record<string, Market> = Object.fromEntries(
  MARKETS.map((m) => [m.name, m])
);

/** Cor de fallback para mercado digitado à mão, fora da lista acima. */
export const UNKNOWN_MARKET: Pick<Market, 'color' | 'onColor'> = {
  color: '#6B6259',
  onColor: '#FFFFFF',
};

export function marketStyle(name: string): Pick<Market, 'color' | 'onColor'> {
  return MARKET_BY_NAME[name] ?? UNKNOWN_MARKET;
}

/**
 * URL de busca do produto no mercado. Devolve `null` para mercado que não
 * está na lista — aí a tela some com o botão em vez de abrir link quebrado.
 */
export function marketSearchUrl(marketName: string, term: string): string | null {
  const market = MARKET_BY_NAME[marketName];
  if (!market) return null;
  return market.searchUrl.replace('{q}', encodeURIComponent(term.trim()));
}

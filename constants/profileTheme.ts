/**
 * Paletas por pessoa.
 *
 * Cada perfil tem duas paletas derivadas da MESMA identidade:
 *
 *  - `PROFILE_THEMES`  -> a tela pessoal (mantém o clima escuro/claro que
 *                        cada perfil já tinha, só que com papéis nomeados,
 *                        contraste corrigido e hierarquia consistente).
 *  - `CALENDAR_THEMES` -> o calendário da pessoa. Todos os calendários usam
 *                        a mesma receita (fundo claro + topo na cor forte
 *                        do perfil + destaque na cor de marca), então o
 *                        calendário de cada um finalmente combina com o
 *                        próprio perfil.
 */

import type { PersonId } from '@/types/database';

export interface ProfileTheme {
  /** Fundo da tela. */
  page: string;
  /** Barra superior. */
  headerBg: string;
  headerTitle: string;
  headerSubtitle: string;
  /** Superfície dos cartões/linhas. */
  card: string;
  /** Superfície rebaixada: cabeçalho de tabela, item concluído. */
  cardSunken: string;
  /** Cor de ação principal (botões cheios, preenchimento de progresso). */
  accent: string;
  onAccent: string;
  /** Versão suave do destaque, para selos sobre `card`. */
  accentSoft: string;
  /** Cor de destaque legível quando usada como TEXTO sobre `card`. */
  onCardAccent: string;
  /** Títulos de seção sobre `page`. */
  title: string;
  /** Texto corrido sobre `card`. */
  text: string;
  textMuted: string;
  /** Texto principal sobre `page` (telas de PIN e configurações). */
  onPage: string;
  /** Texto secundário sobre `page`. */
  textOnPage: string;
  line: string;
  track: string;
  fill: string;
  /** Cartão de estatísticas (o bloco de maior peso visual da tela). */
  statsBg: string;
  statsText: string;
  statsLabel: string;
  statsDivider: string;
}

export const PROFILE_THEMES: Record<PersonId, ProfileTheme> = {
  guilherme: {
    page: '#FFFFFF',
    headerBg: '#0E0E10',
    headerTitle: '#FFFFFF',
    headerSubtitle: '#FF8080',
    card: '#F7F6F6',
    cardSunken: '#EFECEC',
    accent: '#D92121',
    onAccent: '#FFFFFF',
    accentSoft: '#FBE7E7',
    onCardAccent: '#BF1A1A',
    title: '#121214',
    text: '#17181A',
    textMuted: '#75787C',
    onPage: '#121214',
    textOnPage: '#5E6166',
    line: '#E7E3E3',
    track: '#F3DEDE',
    fill: '#D92121',
    statsBg: '#141416',
    statsText: '#FFFFFF',
    statsLabel: '#FF8080',
    statsDivider: 'rgba(255, 255, 255, 0.16)',
  },
  amanda: {
    page: '#4E362B',
    headerBg: '#3A2721',
    headerTitle: '#F5DEB3',
    headerSubtitle: '#D9B48C',
    card: '#64463A',
    cardSunken: '#432F27',
    accent: '#D4A574',
    onAccent: '#2B1C14',
    accentSoft: 'rgba(212, 165, 116, 0.18)',
    onCardAccent: '#E8C9A8',
    title: '#EBD3B5',
    text: '#F7EADA',
    textMuted: '#C0A088',
    onPage: '#F7EADA',
    textOnPage: '#D3B69B',
    line: 'rgba(245, 222, 179, 0.14)',
    track: 'rgba(212, 165, 116, 0.22)',
    fill: '#D4A574',
    statsBg: '#D4A574',
    statsText: '#2B1C14',
    statsLabel: '#5A3E24',
    statsDivider: 'rgba(43, 28, 20, 0.22)',
  },
  renata: {
    page: '#0A0C24',
    headerBg: '#060822',
    headerTitle: '#FFFFFF',
    headerSubtitle: '#FF9AD0',
    card: '#1A2552',
    cardSunken: '#101535',
    accent: '#E64B78',
    onAccent: '#FFFFFF',
    accentSoft: 'rgba(255, 154, 208, 0.16)',
    onCardAccent: '#FF9AD0',
    title: '#FF9AD0',
    text: '#FFFFFF',
    textMuted: '#A9B1E0',
    onPage: '#FFFFFF',
    textOnPage: '#C3C9F0',
    line: 'rgba(255, 154, 208, 0.18)',
    track: 'rgba(255, 154, 208, 0.16)',
    fill: '#FF9AD0',
    statsBg: '#1A2552',
    statsText: '#FF9AD0',
    statsLabel: '#D0D6FF',
    statsDivider: 'rgba(255, 154, 208, 0.34)',
  },
  vander: {
    page: '#0A0E0C',
    headerBg: '#050807',
    headerTitle: '#FFFFFF',
    headerSubtitle: '#7FD4C1',
    card: '#153B2F',
    cardSunken: '#0C1F18',
    // O verde escuro da marca some contra a página quase preta; o menta é
    // a cor de destaque dele e faz os botões aparecerem como nos outros perfis.
    accent: '#7FD4C1',
    onAccent: '#0A2019',
    accentSoft: 'rgba(127, 212, 193, 0.14)',
    onCardAccent: '#7FD4C1',
    title: '#7FD4C1',
    text: '#EAF6F2',
    textMuted: '#8FB3A9',
    onPage: '#EAF6F2',
    textOnPage: '#9FC7BC',
    line: 'rgba(127, 212, 193, 0.16)',
    track: 'rgba(127, 212, 193, 0.14)',
    fill: '#7FD4C1',
    statsBg: '#1A4D3D',
    statsText: '#7FD4C1',
    statsLabel: '#BFEFE3',
    statsDivider: 'rgba(127, 212, 193, 0.3)',
  },
  emanuella: {
    page: '#FFFFFF',
    headerBg: '#E83E8C',
    headerTitle: '#FFFFFF',
    headerSubtitle: '#FFE1EE',
    card: '#FCE4EC',
    cardSunken: '#F8D3E2',
    accent: '#D6247A',
    onAccent: '#FFFFFF',
    accentSoft: '#FAD3E3',
    onCardAccent: '#B3155F',
    title: '#C71A6C',
    text: '#3B1226',
    textMuted: '#94687B',
    onPage: '#3B1226',
    textOnPage: '#7A5566',
    line: 'rgba(199, 26, 108, 0.14)',
    track: 'rgba(232, 62, 140, 0.16)',
    fill: '#E83E8C',
    statsBg: '#E83E8C',
    statsText: '#FFFFFF',
    statsLabel: '#FFE1EE',
    statsDivider: 'rgba(255, 255, 255, 0.34)',
  },
  lucas: {
    page: '#FFFFFF',
    headerBg: '#0E0E10',
    headerTitle: '#FFFFFF',
    headerSubtitle: '#BDBDBD',
    card: '#F5F5F6',
    cardSunken: '#EBEBED',
    accent: '#1A1A1D',
    onAccent: '#FFFFFF',
    accentSoft: '#EAEAEC',
    onCardAccent: '#424242',
    title: '#121214',
    text: '#17181A',
    textMuted: '#757579',
    onPage: '#17181A',
    textOnPage: '#5E5E62',
    line: '#E5E5E8',
    track: '#E8E8EA',
    fill: '#424242',
    statsBg: '#0E0E10',
    statsText: '#FFFFFF',
    statsLabel: '#BDBDBD',
    statsDivider: 'rgba(255, 255, 255, 0.18)',
  },
};

export interface CalendarTheme {
  /** Fundo da tela - um tom bem claro tingido com a cor da pessoa. */
  page: string;
  /** Barra superior, na cor forte do perfil. */
  headerBg: string;
  headerText: string;
  /** Cor de destaque: dia de hoje, botões, badges. */
  accent: string;
  onAccent: string;
  /** Tom claro do destaque - realces e estados selecionados suaves. */
  soft: string;
  /** Célula de dia comum. */
  cell: string;
  /** Superfície de cartão. */
  surface: string;
  /** Texto principal. */
  ink: string;
  inkSoft: string;
  line: string;
  /** Tom escuro da marca, para títulos. */
  deep: string;
}

export const CALENDAR_THEMES: Record<PersonId, CalendarTheme> = {
  guilherme: {
    page: '#FAF7F7',
    headerBg: '#0E0E10',
    headerText: '#FFFFFF',
    accent: '#D92121',
    onAccent: '#FFFFFF',
    soft: '#FBE7E7',
    cell: '#F2EFEF',
    surface: '#FFFFFF',
    ink: '#17181A',
    inkSoft: '#75787C',
    line: '#E7E3E3',
    deep: '#121214',
  },
  amanda: {
    page: '#FBF5EE',
    headerBg: '#3A2721',
    headerText: '#F5DEB3',
    accent: '#8C5A38',
    onAccent: '#FFFFFF',
    soft: '#EFDFC9',
    cell: '#F4EADC',
    surface: '#FFFFFF',
    ink: '#3B2A20',
    inkSoft: '#8A7666',
    line: '#E8D9C7',
    deep: '#4E362B',
  },
  renata: {
    page: '#F8F6FB',
    headerBg: '#0A0C24',
    headerText: '#FF9AD0',
    accent: '#C92A5E',
    onAccent: '#FFFFFF',
    soft: '#FBDFE9',
    cell: '#F0EDF6',
    surface: '#FFFFFF',
    ink: '#1B1D33',
    inkSoft: '#6F6B80',
    line: '#E7E2EE',
    deep: '#151833',
  },
  vander: {
    page: '#F3F9F7',
    headerBg: '#0A1A15',
    headerText: '#7FD4C1',
    accent: '#1F6B55',
    onAccent: '#FFFFFF',
    soft: '#D8EEE7',
    cell: '#E8F3EF',
    surface: '#FFFFFF',
    ink: '#14251F',
    inkSoft: '#63786F',
    line: '#DAE8E3',
    deep: '#10221C',
  },
  emanuella: {
    page: '#FEF6FA',
    headerBg: '#E83E8C',
    headerText: '#FFFFFF',
    accent: '#C71A6C',
    onAccent: '#FFFFFF',
    soft: '#FBE0EB',
    cell: '#F9EAF1',
    surface: '#FFFFFF',
    ink: '#3A1027',
    inkSoft: '#8B6377',
    line: '#F2DCE6',
    deep: '#B3155F',
  },
  lucas: {
    page: '#F7F7F8',
    headerBg: '#0E0E10',
    headerText: '#FFFFFF',
    accent: '#2A2A2D',
    onAccent: '#FFFFFF',
    soft: '#E9E9EC',
    cell: '#F0F0F2',
    surface: '#FFFFFF',
    ink: '#141416',
    inkSoft: '#6C6C70',
    line: '#E3E3E6',
    deep: '#141416',
  },
};

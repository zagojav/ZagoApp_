/**
 * Tokens de design compartilhados por todas as telas do ZagoApp.
 *
 * A ideia é simples: em vez de cada tela inventar seus próprios números
 * mágicos (15, 14, 12, 30...), tudo passa a sair de uma escala única.
 * Isso é o que faz o app inteiro parecer "da mesma família" e é o que
 * conserta a maior parte dos desalinhamentos — caixas com o mesmo papel
 * passam a ter o mesmo raio, o mesmo respiro e a mesma sombra.
 */

import { Platform, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

/** Escala de espaçamento em múltiplos de 4. */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
} as const;

/** Raios de canto. `pill` para chips e botões totalmente arredondados. */
export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

/**
 * Largura reservada à direita dos cabeçalhos para os botões flutuantes
 * (avatar + menu do drawer), que são posicionados em `position: absolute`.
 * Títulos centralizados usam esse valor dos dois lados para ficarem
 * opticamente no centro em vez de escorregarem para a esquerda.
 */
/**
 * Largura máxima da coluna do app na web (e das folhas modais, que o
 * React Native renderiza fora da árvore e por isso precisam do limite
 * repetido — senão escapam da coluna e ocupam a tela toda).
 */
export const APP_MAX_WIDTH = 540;

export const HEADER_ACTION_SLOT = 96;

/** Mesma ideia, para telas que só têm o botão de menu (sem avatar). */
export const HEADER_MENU_SLOT = 56;

/** Altura mínima de alvo de toque — 44pt é o mínimo confortável. */
export const TAP_TARGET = 44;

type ShadowLevel = 0 | 1 | 2 | 3;

const WEB_SHADOWS: Record<ShadowLevel, string> = {
  0: 'none',
  1: '0 1px 2px rgba(15, 12, 10, 0.06), 0 1px 1px rgba(15, 12, 10, 0.04)',
  2: '0 2px 8px rgba(15, 12, 10, 0.08), 0 1px 2px rgba(15, 12, 10, 0.05)',
  3: '0 8px 24px rgba(15, 12, 10, 0.14), 0 2px 6px rgba(15, 12, 10, 0.06)',
};

const NATIVE_SHADOWS: Record<ShadowLevel, ViewStyle & ImageStyle> = {
  0: {},
  1: { shadowColor: '#0F0C0A', shadowOpacity: 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  2: { shadowColor: '#0F0C0A', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  3: { shadowColor: '#0F0C0A', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
};

/**
 * Sombra consistente entre web e nativo.
 *
 * O retorno é `ViewStyle & ImageStyle` porque a mesma sombra é usada tanto
 * em caixas quanto em avatares (`<Image>`), e os dois tipos de estilo do RN
 * não são intercambiáveis.
 */
export function shadow(level: ShadowLevel): ViewStyle & ImageStyle {
  if (level === 0) return {};
  return Platform.OS === 'web'
    ? ({ boxShadow: WEB_SHADOWS[level] } as ViewStyle & ImageStyle)
    : NATIVE_SHADOWS[level];
}

/**
 * Escala tipográfica. `title` mantém o itálico leve que já era a assinatura
 * do app, mas agora com o mesmo tamanho e tracking em todas as telas.
 */
export const Type = {
  screenTitle: { fontSize: 22, fontWeight: '300', fontStyle: 'italic', letterSpacing: 0.6 } as TextStyle,
  sectionTitle: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2 } as TextStyle,
  cardTitle: { fontSize: 15, fontWeight: '600' } as TextStyle,
  body: { fontSize: 14, fontWeight: '400' } as TextStyle,
  label: { fontSize: 13, fontWeight: '600' } as TextStyle,
  meta: { fontSize: 12, fontWeight: '500' } as TextStyle,
  micro: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 } as TextStyle,
} as const;

/**
 * Paleta neutra das telas compartilhadas (Listas, Pets, Afazeres,
 * Mercado, Farmácia e seleção de perfil) — o "bege da casa".
 */
export const Casa = {
  page: '#A89080',
  pageDeep: '#9B8271',
  header: '#A89080',
  surface: '#FFFFFF',
  surfaceSunken: '#F4F1ED',
  surfaceWarm: '#E8DCC8',
  surfaceWarmDeep: '#D8C7B1',
  accent: '#8C6A45',
  accentSoft: '#C9A876',
  onAccent: '#FFFFFF',
  ink: '#2A2018',
  inkOnPage: '#2A2018',
  inkMuted: '#6B6259',
  inkFaint: '#9A9086',
  line: '#E6E0D8',
  lineOnPage: 'rgba(42, 32, 24, 0.14)',
  chipIdle: 'rgba(255, 255, 255, 0.42)',
  danger: '#C0392B',
} as const;

/** Superfície de modal padrão, igual em todas as telas. */
export const Sheet = {
  scrim: 'rgba(24, 18, 14, 0.58)',
  surface: '#FFFFFF',
  handle: '#DFD8D0',
  line: '#EFEBE6',
  title: '#221A14',
  label: '#4A4038',
  input: '#F7F5F2',
  inputLine: '#E3DDD6',
  placeholder: '#A9A099',
  muted: '#7C736B',
} as const;

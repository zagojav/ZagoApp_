import { Platform, View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { APP_MAX_WIDTH } from '@/constants/design';
import { AppErrorBoundary } from '@/components/error-boundary';

// O Expo Router procura um export chamado `ErrorBoundary` no layout e passa
// a usá-lo para qualquer erro de renderização abaixo dele. Sem isso, um erro
// inesperado vira tela branca sem explicação.
export { AppErrorBoundary as ErrorBoundary };

/**
 * O ZagoApp é desenhado para o celular, mas também roda no navegador.
 * Sem limite de largura, uma tela de 1920px esticava a grade do calendário
 * em quadrados gigantes e deixava os cartões com linhas intermináveis.
 *
 * Na web o app inteiro passa a viver numa coluna com a proporção de um
 * celular, centralizada sobre um fundo neutro. No celular a coluna ocupa
 * 100% da largura, então nada muda por lá.
 */

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <View style={styles.frame}>
          <View style={styles.column}>
            <Stack screenOptions={{ headerShown: false }} />
          </View>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  frame: Platform.select({
    web: { flex: 1, backgroundColor: '#2E2722', alignItems: 'center' },
    default: { flex: 1 },
  }),
  column: Platform.select({
    web: {
      flex: 1,
      width: '100%',
      maxWidth: APP_MAX_WIDTH,
      overflow: 'hidden',
      backgroundColor: '#FFFFFF',
    },
    default: { flex: 1 },
  }),
});

import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import type { ErrorBoundaryProps } from 'expo-router';
import { Casa, Radius, Sheet, Spacing, Type, shadow } from '@/constants/design';

/**
 * Tela mostrada quando alguma rota quebra em tempo de renderização.
 *
 * O Expo Router aceita um `ErrorBoundary` exportado de um layout e passa a
 * usá-lo para tudo que está abaixo dele — é por isso que `app/_layout.tsx`
 * reexporta este componente. Sem ele, um erro inesperado vira tela branca
 * (web) ou app travado (celular), sem nenhuma pista do que houve.
 *
 * O `retry` do Expo Router remonta a rota, o que resolve a maior parte dos
 * erros transitórios (rede caindo no meio de uma leitura, por exemplo).
 */
export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  // Fica no console do navegador / Metro para dar o que investigar depois.
  console.error('[ZagoApp] erro não tratado na renderização:', error);

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>😵‍💫</Text>
      <Text style={styles.title}>Algo deu errado</Text>
      <Text style={styles.message}>
        Essa tela travou. Tentar de novo costuma resolver — se continuar, feche
        e abra o app.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={retry}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Tentar de novo"
      >
        <Text style={styles.buttonText}>Tentar de novo</Text>
      </TouchableOpacity>

      {/* Detalhe técnico fica recolhido no rodapé: ajuda a debugar sem
          assustar quem só quer usar o app. */}
      <ScrollView style={styles.detailBox} contentContainerStyle={styles.detailInner}>
        <Text style={styles.detailLabel}>Detalhe técnico</Text>
        <Text style={styles.detailText}>{error?.message ?? 'Erro desconhecido'}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Casa.page,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  emoji: { fontSize: 44, lineHeight: 52, marginBottom: Spacing.lg },
  title: { ...Type.screenTitle, fontSize: 24, color: Casa.ink, marginBottom: Spacing.sm, textAlign: 'center' },
  message: {
    fontSize: 14,
    color: Casa.inkMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
    maxWidth: 320,
  },
  button: {
    backgroundColor: Casa.accent,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.md,
    ...shadow(1),
  },
  buttonText: { fontSize: 15, fontWeight: '700', color: Casa.onAccent },
  detailBox: {
    marginTop: Spacing.xxl,
    maxHeight: 120,
    alignSelf: 'stretch',
    backgroundColor: Sheet.input,
    borderRadius: Radius.sm,
  },
  detailInner: { padding: Spacing.md },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Sheet.muted,
    marginBottom: Spacing.xs,
  },
  detailText: { fontSize: 12, color: Sheet.label, lineHeight: 17 },
});

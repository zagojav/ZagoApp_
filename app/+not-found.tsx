import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, Stack } from 'expo-router';
import { Casa, Radius, Spacing, Type, shadow } from '@/constants/design';

/**
 * Tela de rota inexistente. Sem isso, o Expo Router mostra a própria tela
 * preta de "Unmatched Route", que não parece o app.
 */
export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Página não encontrada' }} />
      <View style={styles.container}>
        <Text style={styles.emoji}>🧭</Text>
        <Text style={styles.title}>Página não encontrada</Text>
        <Text style={styles.message}>
          Esse endereço não existe no ZagoApp. Pode ser um link antigo ou um
          atalho salvo que mudou de lugar.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Voltar para o início"
        >
          <Text style={styles.buttonText}>Voltar para o início</Text>
        </TouchableOpacity>
      </View>
    </>
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
    marginBottom: Spacing.xxl,
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
});

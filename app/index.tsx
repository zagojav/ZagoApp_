import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { ensureFamilySeeded, ensurePetsSeeded } from '@/services/seed';
import { withTimeout } from '@/utils/withTimeout';
import { Casa, Radius, Spacing, Type, shadow } from '@/constants/design';

export default function Index() {
  const { user, loading: authLoading, error: authError } = useAuth();
  const { activeProfileId, loading: profileLoading } = useActiveProfile();
  const [seeded, setSeeded] = useState(false);
  const [seedError, setSeedError] = useState<Error | null>(null);

  useEffect(() => {
    if (user && !seeded && !seedError) {
      withTimeout(
        Promise.all([ensureFamilySeeded(), ensurePetsSeeded()]),
        10000,
        'Não foi possível carregar os dados da família. Tente recarregar a página.'
      )
        .then(() => setSeeded(true))
        .catch((err) => setSeedError(err instanceof Error ? err : new Error(String(err))));
    }
  }, [user, seeded, seedError]);

  const fatalError = authError || seedError;
  if (fatalError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorCard}>
          <Text style={styles.errorIcon}>📡</Text>
          <Text style={styles.errorTitle}>Não foi possível conectar</Text>
          <Text style={styles.errorMessage}>{fatalError.message}</Text>
          <Text style={styles.errorHint}>
            Confira sua conexão e se as regras do Firestore já foram publicadas.
          </Text>
        </View>
      </View>
    );
  }

  if (authLoading || profileLoading || (user && !seeded)) {
    return (
      <View style={styles.container}>
        <Text style={styles.brand}>ZagoApp</Text>
        <ActivityIndicator size="large" color={Casa.accent} style={{ marginTop: Spacing.xl }} />
      </View>
    );
  }

  if (activeProfileId) {
    return <Redirect href="/(home)/inicio" />;
  }

  return <Redirect href="/(auth)/profile-select" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Casa.page,
    paddingHorizontal: Spacing.xxl,
  },
  brand: { ...Type.screenTitle, fontSize: 26, color: Casa.ink },
  errorCard: {
    backgroundColor: Casa.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xxl,
    alignItems: 'center',
    maxWidth: 420,
    ...shadow(2),
  },
  errorIcon: { fontSize: 34, lineHeight: 40, marginBottom: Spacing.md },
  errorTitle: { fontSize: 17, fontWeight: '700', color: Casa.ink, marginBottom: Spacing.sm, textAlign: 'center' },
  errorMessage: { fontSize: 13, color: Casa.inkMuted, textAlign: 'center', marginBottom: Spacing.md, lineHeight: 19 },
  errorHint: { fontSize: 12, color: Casa.inkFaint, textAlign: 'center', lineHeight: 17 },
});

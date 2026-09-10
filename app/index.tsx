import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { ensureFamilySeeded, ensurePetsSeeded } from '@/services/seed';
import { withTimeout } from '@/utils/withTimeout';

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
        <Text style={styles.errorTitle}>Não foi possível conectar</Text>
        <Text style={styles.errorMessage}>{fatalError.message}</Text>
        <Text style={styles.errorHint}>
          Confira sua conexão e se as regras do Firestore já foram publicadas.
        </Text>
      </View>
    );
  }

  if (authLoading || profileLoading || (user && !seeded)) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6f5947" />
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
    backgroundColor: '#a89080',
    paddingHorizontal: 24,
  },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#2a2a2a', marginBottom: 8 },
  errorMessage: { fontSize: 13, color: '#4a4a4a', textAlign: 'center', marginBottom: 12 },
  errorHint: { fontSize: 12, color: '#5a4a40', textAlign: 'center', fontStyle: 'italic' },
});

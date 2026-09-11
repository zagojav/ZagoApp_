import { useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { hashPin } from '@/utils/pin';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { PinPad } from '@/components/pin-pad';
import { PERSON_PROFILES } from '@/constants/personProfiles';
import { PROFILE_THEMES } from '@/constants/profileTheme';
import { Casa, Spacing, shadow } from '@/constants/design';
import type { PersonId } from '@/types/database';

type Step = 'create' | 'confirm';

export default function PinSetupScreen() {
  const { userId } = useLocalSearchParams<{ userId: PersonId }>();
  const { setActiveProfile } = useActiveProfile();
  const [step, setStep] = useState<Step>('create');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);

  const profile = userId ? PERSON_PROFILES[userId] : null;

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: Casa.page }]}>
        <Text style={[styles.title, { color: Casa.ink }]}>Perfil não encontrado</Text>
      </View>
    );
  }

  const theme = PROFILE_THEMES[profile.id];

  const handleComplete = async (value: string) => {
    if (step === 'create') {
      setFirstPin(value);
      setError('');
      setStep('confirm');
      setAttempt((a) => a + 1);
      return;
    }

    if (value !== firstPin) {
      setError('Os PINs não coincidem. Vamos tentar de novo.');
      setFirstPin('');
      setStep('create');
      setAttempt((a) => a + 1);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const pinHash = await hashPin(value);
      await updateDoc(doc(db, 'users', profile.id), {
        pinHash,
        pinSet: true,
        updatedAt: serverTimestamp(),
      });
      await setActiveProfile(profile.id);
      router.replace('/(home)/inicio');
    } catch {
      setError('Não foi possível salvar o PIN. Verifique sua conexão.');
      setSaving(false);
      setFirstPin('');
      setStep('create');
      setAttempt((a) => a + 1);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.page }]}>
      <Image source={profile.image} style={[styles.avatar, { borderColor: theme.fill }]} />
      <Text style={[styles.title, { color: theme.onPage }]}>Oi, {profile.name}!</Text>
      <Text style={[styles.subtitle, { color: theme.textOnPage }]}>
        {step === 'create' ? 'Crie um PIN de 4 dígitos' : 'Digite o PIN novamente para confirmar'}
      </Text>

      {saving ? (
        <View style={styles.padPlaceholder}>
          <ActivityIndicator size="large" color={theme.fill} />
        </View>
      ) : (
        <PinPad
          key={attempt}
          accentColor={theme.fill}
          textColor={theme.onPage}
          onComplete={handleComplete}
          errorMessage={error}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xxl },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 3,
    marginBottom: Spacing.lg,
    ...shadow(2),
  },
  title: { fontSize: 24, fontWeight: '700', marginBottom: Spacing.xs, letterSpacing: 0.3 },
  subtitle: { fontSize: 14, marginBottom: Spacing.xl, textAlign: 'center', fontWeight: '500' },
  padPlaceholder: { height: 282, justifyContent: 'center', alignItems: 'center' },
});

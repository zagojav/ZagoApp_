import { useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { hashPin } from '@/utils/pin';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { PinPad } from '@/components/pin-pad';
import { PERSON_PROFILES } from '@/constants/personProfiles';
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
      <View style={styles.container}>
        <Text style={styles.title}>Perfil não encontrado</Text>
      </View>
    );
  }

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
    <View style={[styles.container, { backgroundColor: profile.colors.primary }]}>
      <Image source={profile.image} style={styles.avatar} />
      <Text style={[styles.title, { color: profile.colors.secondary }]}>
        Oi, {profile.name}!
      </Text>
      <Text style={[styles.subtitle, { color: profile.colors.secondary }]}>
        {step === 'create' ? 'Crie um PIN de 4 dígitos' : 'Digite o PIN novamente para confirmar'}
      </Text>

      {saving ? (
        <ActivityIndicator size="large" color={profile.colors.secondary} style={{ marginTop: 24 }} />
      ) : (
        <PinPad
          key={attempt}
          accentColor={profile.colors.accent}
          onComplete={handleComplete}
          errorMessage={error}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 24, textAlign: 'center' },
});

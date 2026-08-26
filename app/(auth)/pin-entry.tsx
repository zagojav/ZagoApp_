import { useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { useFamily } from '@/hooks/useFamily';
import { hashPin } from '@/utils/pin';
import { PinPad } from '@/components/pin-pad';
import { PERSON_PROFILES } from '@/constants/personProfiles';
import type { PersonId } from '@/types/database';

export default function PinEntryScreen() {
  const { userId } = useLocalSearchParams<{ userId: PersonId }>();
  const { members, loading } = useFamily();
  const { setActiveProfile } = useActiveProfile();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [checking, setChecking] = useState(false);

  const profile = userId ? PERSON_PROFILES[userId] : null;
  const member = members.find((m) => m.id === userId);

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Perfil não encontrado</Text>
      </View>
    );
  }

  const handleComplete = async (value: string) => {
    if (!member) return;
    setChecking(true);
    setError('');
    try {
      const hash = await hashPin(value);
      if (hash === member.pinHash) {
        await setActiveProfile(profile.id);
        router.replace('/(home)/inicio');
        return;
      }
      setError('PIN incorreto. Tente de novo.');
      setAttempt((a) => a + 1);
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: profile.colors.primary }]}>
      <Image source={profile.image} style={styles.avatar} />
      <Text style={[styles.title, { color: profile.colors.secondary }]}>{profile.name}</Text>
      <Text style={[styles.subtitle, { color: profile.colors.secondary }]}>Digite seu PIN</Text>

      {loading || checking ? (
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

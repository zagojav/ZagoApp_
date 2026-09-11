import { useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { useFamily } from '@/hooks/useFamily';
import { hashPin } from '@/utils/pin';
import { PinPad } from '@/components/pin-pad';
import { PERSON_PROFILES } from '@/constants/personProfiles';
import { PROFILE_THEMES } from '@/constants/profileTheme';
import { Casa, Spacing, shadow } from '@/constants/design';
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
      <View style={[styles.container, { backgroundColor: Casa.page }]}>
        <Text style={[styles.title, { color: Casa.ink }]}>Perfil não encontrado</Text>
      </View>
    );
  }

  const theme = PROFILE_THEMES[profile.id];

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
    <View style={[styles.container, { backgroundColor: theme.page }]}>
      <Image
        source={member?.photoUrl ? { uri: member.photoUrl } : profile.image}
        style={[styles.avatar, { borderColor: theme.fill }]}
      />
      <Text style={[styles.title, { color: theme.onPage }]}>{profile.name}</Text>
      <Text style={[styles.subtitle, { color: theme.textOnPage }]}>Digite seu PIN</Text>

      {loading || checking ? (
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

      <TouchableOpacity style={styles.backLink} onPress={() => router.replace('/(auth)/profile-select')} activeOpacity={0.7}>
        <Text style={[styles.backLinkText, { color: theme.textOnPage }]}>Trocar de perfil</Text>
      </TouchableOpacity>
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
  /** Mesma altura do teclado, para a tela não "pular" durante a checagem. */
  padPlaceholder: { height: 282, justifyContent: 'center', alignItems: 'center' },
  backLink: { marginTop: Spacing.xl, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  backLinkText: { fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
});

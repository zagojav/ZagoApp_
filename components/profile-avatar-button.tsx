import { useState } from 'react';
import { Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFamily } from '@/hooks/useFamily';
import { ProfilePhotoUpload } from './ProfilePhotoUpload';
import { PERSON_PROFILES } from '@/constants/personProfiles';
import { shadow } from '@/constants/design';
import type { PersonId } from '@/types/database';

interface ProfileAvatarButtonProps {
  profileId: PersonId;
}

export function ProfileAvatarButton({ profileId }: ProfileAvatarButtonProps) {
  const insets = useSafeAreaInsets();
  const { members } = useFamily();
  const [visible, setVisible] = useState(false);
  const profile = PERSON_PROFILES[profileId];
  const member = members.find((m) => m.id === profileId);

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { top: insets.top + 10, borderColor: profile.colors.accent }]}
        onPress={() => setVisible(true)}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={`Foto de ${profile.name}`}
      >
        <Image source={member?.photoUrl ? { uri: member.photoUrl } : profile.image} style={styles.avatar} />
      </TouchableOpacity>

      <ProfilePhotoUpload
        visible={visible}
        userId={profileId}
        currentPhotoUrl={member?.photoUrl}
        fallbackImage={profile.image}
        profileColor={profile.colors.primary}
        onPhotoSelected={() => {}}
        onClose={() => setVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    // 12 (margem) + 36 (botão de menu) + 8 (respiro) = 56
    right: 56,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    overflow: 'hidden',
    zIndex: 999,
    ...shadow(1),
  },
  avatar: { width: '100%', height: '100%' },
});

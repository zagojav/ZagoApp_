import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useFamily, type FamilyMember } from '@/hooks/useFamily';
import { PERSON_ORDER, PERSON_PROFILES } from '@/constants/personProfiles';

export default function ProfileSelectScreen() {
  const { members, loading } = useFamily();

  const handleSelectProfile = (member: FamilyMember) => {
    if (member.pinSet) {
      router.push({ pathname: '/(auth)/pin-entry', params: { userId: member.id } });
    } else {
      router.push({ pathname: '/(auth)/pin-setup', params: { userId: member.id } });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Deseja entrar em qual perfil?</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#6f5947" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {PERSON_ORDER.map((id) => {
            const member = members.find((m) => m.id === id);
            const profile = PERSON_PROFILES[id];
            if (!member) return null;
            return (
              <TouchableOpacity
                key={id}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => handleSelectProfile(member)}
              >
                <Image
                  source={member.photoUrl ? { uri: member.photoUrl } : profile.image}
                  style={[styles.avatar, { borderColor: profile.colors.accent }]}
                />
                <Text style={styles.name}>{profile.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#a89080', paddingTop: 80, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: '300', fontStyle: 'italic', color: '#2a2a2a', textAlign: 'center', marginBottom: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 24, paddingBottom: 20 },
  card: { alignItems: 'center', width: 100 },
  avatar: { width: 84, height: 84, borderRadius: 42, borderWidth: 3, marginBottom: 10 },
  name: { fontSize: 14, fontWeight: '600', color: '#2a2a2a' },
});

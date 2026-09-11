import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFamily, type FamilyMember } from '@/hooks/useFamily';
import { PERSON_ORDER, PERSON_PROFILES } from '@/constants/personProfiles';
import { Casa, Radius, Spacing, Type, shadow } from '@/constants/design';

export default function ProfileSelectScreen() {
  const insets = useSafeAreaInsets();
  const { members, loading, error } = useFamily();

  const handleSelectProfile = (member: FamilyMember) => {
    if (member.pinSet) {
      router.push({ pathname: '/(auth)/pin-entry', params: { userId: member.id } });
    } else {
      router.push({ pathname: '/(auth)/pin-setup', params: { userId: member.id } });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xxxl }]}>
      <View style={styles.intro}>
        <Text style={styles.brand}>ZagoApp</Text>
        <Text style={styles.title}>Deseja entrar em qual perfil?</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Não foi possível carregar os perfis</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <Text style={styles.errorHint}>Confira sua conexão e tente recarregar a página.</Text>
        </View>
      ) : loading ? (
        <ActivityIndicator size="large" color={Casa.accent} style={{ marginTop: Spacing.xxxl }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {PERSON_ORDER.map((id) => {
              const member = members.find((m) => m.id === id);
              const profile = PERSON_PROFILES[id];
              if (!member) return null;
              return (
                <TouchableOpacity
                  key={id}
                  style={styles.card}
                  activeOpacity={0.75}
                  onPress={() => handleSelectProfile(member)}
                >
                  <Image
                    source={member.photoUrl ? { uri: member.photoUrl } : profile.image}
                    style={[styles.avatar, { borderColor: profile.colors.accent }]}
                  />
                  <Text style={styles.name} numberOfLines={1}>{profile.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

/** Célula de largura fixa: as colunas ficam no prumo em qualquer tela, e a
 *  grade fecha em 3 colunas — com seis pessoas, isso dá duas linhas cheias
 *  em vez de uma linha de quatro e outra de duas. */
const CARD = 104;
const COLUMNS = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Casa.page, paddingHorizontal: Spacing.xl },
  intro: { alignItems: 'center', marginBottom: Spacing.xxl },
  brand: { ...Type.screenTitle, fontSize: 26, color: Casa.ink, marginBottom: Spacing.xs },
  title: { fontSize: 14, color: Casa.inkMuted, fontWeight: '500', textAlign: 'center' },
  scrollInner: { paddingBottom: Spacing.xxl },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignSelf: 'center',
    maxWidth: CARD * COLUMNS + Spacing.xl * (COLUMNS - 1),
    gap: Spacing.xl,
  },
  card: { width: CARD, alignItems: 'center' },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 3,
    marginBottom: Spacing.sm + 2,
    backgroundColor: Casa.surfaceWarm,
    ...shadow(2),
  },
  name: { fontSize: 14, fontWeight: '600', color: Casa.ink, textAlign: 'center' },
  errorBox: {
    marginTop: Spacing.xxl,
    backgroundColor: Casa.surface,
    borderRadius: Radius.md,
    padding: Spacing.xl,
    ...shadow(1),
  },
  errorTitle: { fontSize: 15, fontWeight: '700', color: Casa.ink, textAlign: 'center', marginBottom: Spacing.sm },
  errorMessage: { fontSize: 13, color: Casa.inkMuted, textAlign: 'center', marginBottom: Spacing.md },
  errorHint: { fontSize: 12, color: Casa.inkFaint, textAlign: 'center' },
});

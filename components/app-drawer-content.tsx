import { View, Text, TouchableOpacity, Pressable, Image, StyleSheet } from 'react-native';
import { DrawerContentScrollView, type DrawerContentComponentProps } from '@react-navigation/drawer';
import { router } from 'expo-router';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { useFamily } from '@/hooks/useFamily';
import { PERSON_PROFILES } from '@/constants/personProfiles';
import { Radius, Spacing, shadow } from '@/constants/design';

const DRAWER_TEXT_COLOR = '#FFFFFF';

export function AppDrawerContent(props: DrawerContentComponentProps) {
  const { activeProfileId, clearActiveProfile } = useActiveProfile();
  const { members } = useFamily();
  const profile = activeProfileId ? PERSON_PROFILES[activeProfileId] : null;
  const member = members.find((m) => m.id === activeProfileId);
  const bg = profile?.colors.primary ?? '#6f5947';
  const hover = profile?.colors.hover ?? 'rgba(255,255,255,0.15)';
  const currentRoute = props.state.routeNames[props.state.index];

  const handleSair = async () => {
    await clearActiveProfile();
    router.replace('/(auth)/profile-select');
  };

  const items: { label: string; icon: string; screen: string }[] = [
    { label: 'Página Inicial', icon: '🏠', screen: 'inicio' },
    { label: 'Listas', icon: '📋', screen: 'listas' },
    { label: 'Pets', icon: '🐾', screen: 'pets' },
    { label: 'Afazeres', icon: '✅', screen: 'afazeres' },
    { label: 'Configurações', icon: '⚙️', screen: 'settings' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent} style={{ backgroundColor: bg }}>
        <View style={styles.logoBlock}>
          <Text style={styles.logoTitle}>ZagoApp</Text>
          {profile ? (
            <View style={styles.profileRow}>
              <Image
                source={member?.photoUrl ? { uri: member.photoUrl } : profile.image}
                style={[styles.profileAvatar, { borderColor: profile.colors.accent }]}
              />
              <Text style={styles.logoSubtitle} numberOfLines={1}>
                Olá, {profile.name}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.itemsBlock}>
          {items.map((item) => {
            const isActive = currentRoute === item.screen;
            return (
              <Pressable
                key={item.screen}
                style={({ pressed }) => [
                  styles.item,
                  isActive && { backgroundColor: hover },
                  pressed && !isActive && { backgroundColor: hover, opacity: 0.75 },
                ]}
                onPress={() => props.navigation.navigate(item.screen)}
              >
                {/* Largura fixa no ícone: os rótulos ficam todos na mesma
                    coluna, em vez de dançarem conforme a largura do emoji. */}
                <Text style={styles.itemIcon}>{item.icon}</Text>
                <Text style={[styles.itemText, isActive && styles.itemTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </DrawerContentScrollView>

      <TouchableOpacity style={styles.sairBtn} onPress={handleSair} activeOpacity={0.85}>
        <Text style={styles.sairIcon}>🚪</Text>
        <Text style={styles.sairText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 0 },
  logoBlock: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.14)',
    marginBottom: Spacing.md,
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: '300',
    fontStyle: 'italic',
    color: DRAWER_TEXT_COLOR,
    letterSpacing: 1,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 2, marginTop: Spacing.md },
  profileAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 2 },
  logoSubtitle: { flex: 1, fontSize: 14, color: DRAWER_TEXT_COLOR, opacity: 0.9, fontWeight: '500' },
  itemsBlock: { paddingHorizontal: Spacing.md },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.md,
    marginBottom: Spacing.xs,
  },
  itemIcon: { fontSize: 17, lineHeight: 22, width: 28, textAlign: 'center', marginRight: Spacing.sm + 2 },
  itemText: { flex: 1, fontSize: 15, color: DRAWER_TEXT_COLOR, fontWeight: '500', opacity: 0.85 },
  itemTextActive: { fontWeight: '700', opacity: 1 },
  sairBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.md,
    backgroundColor: '#C0392B',
    ...shadow(1),
  },
  sairIcon: { fontSize: 15, lineHeight: 18, marginRight: Spacing.sm },
  sairText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});

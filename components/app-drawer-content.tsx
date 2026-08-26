import { View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { DrawerContentScrollView, type DrawerContentComponentProps } from '@react-navigation/drawer';
import { router } from 'expo-router';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { PERSON_PROFILES } from '@/constants/personProfiles';

const DRAWER_TEXT_COLOR = '#FFFFFF';

export function AppDrawerContent(props: DrawerContentComponentProps) {
  const { activeProfileId, clearActiveProfile } = useActiveProfile();
  const profile = activeProfileId ? PERSON_PROFILES[activeProfileId] : null;
  const bg = profile?.colors.primary ?? '#6f5947';
  const hover = profile?.colors.hover ?? 'rgba(255,255,255,0.15)';

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
          {profile ? <Text style={styles.logoSubtitle}>Olá, {profile.name}</Text> : null}
        </View>

        {items.map((item) => (
          <Pressable
            key={item.screen}
            style={({ pressed }) => [styles.item, pressed && { backgroundColor: hover }]}
            onPress={() => props.navigation.navigate(item.screen)}
          >
            <Text style={styles.itemIcon}>{item.icon}</Text>
            <Text style={styles.itemText}>{item.label}</Text>
          </Pressable>
        ))}
      </DrawerContentScrollView>

      <TouchableOpacity style={styles.sairBtn} onPress={handleSair} activeOpacity={0.8}>
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
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
    marginBottom: 8,
  },
  logoTitle: { fontSize: 24, fontWeight: '300', fontStyle: 'italic', color: DRAWER_TEXT_COLOR, letterSpacing: 1 },
  logoSubtitle: { fontSize: 13, color: DRAWER_TEXT_COLOR, marginTop: 4, opacity: 0.85 },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  itemIcon: { fontSize: 18, marginRight: 14 },
  itemText: { fontSize: 15, color: DRAWER_TEXT_COLOR, fontWeight: '500' },
  sairBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#e53935',
  },
  sairIcon: { fontSize: 16, marginRight: 8 },
  sairText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});

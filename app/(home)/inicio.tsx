import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { DrawerMenuButton } from '@/components/drawer-menu-button';
import { ProfileAvatarButton } from '@/components/profile-avatar-button';
import GuilhermeScreen from '../pessoal/guilherme';
import AmandaScreen from '../pessoal/amanda';
import RenataScreen from '../pessoal/renata';
import VanderScreen from '../pessoal/vander';
import EmanuellaScreen from '../pessoal/emanuella';
import LucasScreen from '../pessoal/lucas';

export default function HomeIndexScreen() {
  const { activeProfileId, loading } = useActiveProfile();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6f5947" />
      </View>
    );
  }

  if (!activeProfileId) {
    return <Redirect href="/(auth)/profile-select" />;
  }

  return (
    <>
      <DrawerMenuButton />
      <ProfileAvatarButton profileId={activeProfileId} />
      {activeProfileId === 'guilherme' && <GuilhermeScreen />}
      {activeProfileId === 'amanda' && <AmandaScreen />}
      {activeProfileId === 'renata' && <RenataScreen />}
      {activeProfileId === 'vander' && <VanderScreen />}
      {activeProfileId === 'emanuella' && <EmanuellaScreen />}
      {activeProfileId === 'lucas' && <LucasScreen />}
    </>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#a89080' },
});

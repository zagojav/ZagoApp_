import { Drawer } from 'expo-router/drawer';
import { AppDrawerContent } from '@/components/app-drawer-content';

// Screens are always registered here — expo-router's Drawer wrapper
// (withLayoutContext) doesn't tolerate conditional children, not even
// `null` mixed into the list. Admin-only gating for "settings" happens at
// two other layers instead: AppDrawerContent only lists it in the menu for
// Guilherme, and settings.tsx redirects away if reached by anyone else.
export default function HomeLayout() {
  return (
    <Drawer
      screenOptions={{ headerShown: false }}
      drawerContent={(props) => <AppDrawerContent {...props} />}
    >
      <Drawer.Screen name="inicio" options={{ drawerLabel: 'Página Inicial' }} />
      <Drawer.Screen name="listas" options={{ drawerLabel: 'Listas' }} />
      <Drawer.Screen name="pets" options={{ drawerLabel: 'Pets' }} />
      <Drawer.Screen name="afazeres" options={{ drawerLabel: 'Afazeres' }} />
      <Drawer.Screen name="settings" options={{ drawerLabel: 'Configurações' }} />
    </Drawer>
  );
}

import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MarketSessionProvider } from '@/context/MarketSessionContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <MarketSessionProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </MarketSessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

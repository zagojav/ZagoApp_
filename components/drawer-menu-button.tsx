import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radius, shadow } from '@/constants/design';

/**
 * Botão flutuante do menu. Fica na mesma linha e com o mesmo tamanho do
 * `ProfileAvatarButton` — os dois formam um par alinhado no canto superior
 * direito, e as telas reservam essa faixa via `HEADER_ACTION_SLOT`.
 */
export function DrawerMenuButton() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      style={[styles.button, { top: insets.top + 10 }]}
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel="Abrir menu"
    >
      <Text style={styles.icon}>☰</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 12,
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(16, 12, 9, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    ...shadow(1),
  },
  icon: { fontSize: 16, lineHeight: 18, color: '#fff', fontWeight: '700' },
});

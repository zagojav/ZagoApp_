import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { casa } from '@/constants/casaStyles';
import { Casa, HEADER_MENU_SLOT, Radius, Spacing, shadow } from '@/constants/design';

const initialLists = [
  { id: 1, name: 'Mercado', icon: '🛒', hint: 'Compras do mês, da semana e de necessidade' },
  { id: 2, name: 'Farmácia', icon: '💊', hint: 'Remédios e itens de cuidado' },
];

export default function ListasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [lists] = useState(initialLists);

  const handleListPress = (name: string) => {
    if (name === 'Mercado') {
      router.push('/listas/mercado');
    } else if (name === 'Farmácia') {
      router.push('/listas/farmacia');
    }
  };

  return (
    <View style={casa.container}>
      <View style={[casa.header, styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={casa.headerTitleFlex}>Listas</Text>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.listContainer}>
          {lists.map(list => (
            <TouchableOpacity
              key={list.id}
              style={styles.listButton}
              onPress={() => handleListPress(list.name)}
              activeOpacity={0.8}
            >
              <View style={styles.listIconCircle}>
                <Text style={styles.listIcon}>{list.icon}</Text>
              </View>
              <View style={styles.listTextBlock}>
                <Text style={styles.listButtonText}>{list.name}</Text>
                <Text style={styles.listHint}>{list.hint}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingRight: HEADER_MENU_SLOT },
  scrollContent: { flex: 1 },
  scrollContainer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
  listContainer: { gap: Spacing.md + 2, width: '100%', maxWidth: 520, alignSelf: 'center' },
  listButton: {
    backgroundColor: Casa.surfaceWarm,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    ...shadow(1),
  },
  listIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Casa.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listIcon: { fontSize: 21, lineHeight: 26 },
  listTextBlock: { flex: 1, gap: 2 },
  listButtonText: { fontSize: 17, fontWeight: '600', color: Casa.ink },
  listHint: { fontSize: 12, color: Casa.inkMuted, lineHeight: 16 },
  chevron: { fontSize: 22, lineHeight: 24, color: Casa.inkMuted, fontWeight: '700' },
});

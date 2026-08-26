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

const initialLists = [
  { id: 1, name: 'Mercado' },
  { id: 2, name: 'Farmácia' },
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
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <Text style={styles.headerTitle}>Listas</Text>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.listContainer}>
          {lists.map(list => (
            <TouchableOpacity
              key={list.id}
              style={styles.listButton}
              onPress={() => handleListPress(list.name)}
              activeOpacity={0.8}
            >
              <Text style={styles.listButtonText}>{list.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#a89080' 
  },
  header: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#a89080',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '300',
    fontStyle: 'italic',
    color: '#2a2a2a',
    letterSpacing: 1,
  },
  scrollContent: { 
    flex: 1 
  },
  scrollContainer: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 50 
  },
  listContainer: { 
    width: '80%', 
    gap: 30 
  },
  listButton: {
    backgroundColor: '#e8dcc8',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listButtonText: {
    fontSize: 18,
    fontWeight: '400',
    color: '#2a2a2a',
    fontStyle: 'italic',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';

const initialLists = [
  { id: 1, name: 'Mercado' },
  { id: 2, name: 'Farmácia' },
];

export default function ListasScreen() {
  const router = useRouter();
  const [lists] = useState(initialLists);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleListPress = (name: string) => {
    if (name === 'Mercado') {
      router.push('/listas/mercado');
    } else if (name === 'Farmácia') {
      router.push('/listas/farmacia');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setMenuOpen(true)}
        >
          <Text style={styles.backIcon}>☰</Text>
        </TouchableOpacity>
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

      {/* Menu lateral */}
      {menuOpen && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setMenuOpen(false)}
          activeOpacity={1}
        >
          <View style={styles.sideMenu}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setMenuOpen(false)}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                router.push('/home');
              }}
            >
              <Text style={styles.menuText}>Página Inicial</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                router.push('/pets');
              }}
            >
              <Text style={styles.menuText}>Pets</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                router.push('/afazeres');
              }}
            >
              <Text style={styles.menuText}>Afazeres de casa</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
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
  backButton: {
    padding: 10,
    marginRight: 15,
    backgroundColor: '#d4c5b9',
    borderRadius: 8,
  },
  backIcon: { 
    fontSize: 25, 
    color: '#2a2a2a', 
    fontWeight: 'bold' 
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sideMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '65%',
    height: '100%',
    backgroundColor: '#6f5947',
    paddingTop: 20,
  },
  closeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  closeIcon: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});

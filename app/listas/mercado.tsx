import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Modal, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { salvar, carregar } from '../../utils/storage';

interface Item {
  id: string;
  name: string;
  quantity: string;
  category: 'Compra do mês' | 'Compra da semana' | 'Compra de necessidade';
  collected: boolean;
}

export default function MercadoScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formCategory, setFormCategory] = useState<'Compra do mês' | 'Compra da semana' | 'Compra de necessidade'>('Compra da semana');
  const [isShoppingMode, setIsShoppingMode] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(['Compra do mês', 'Compra da semana', 'Compra de necessidade'])
  );
  const [completionModalVisible, setCompletionModalVisible] = useState(false);

  const categories: Array<'Compra do mês' | 'Compra da semana' | 'Compra de necessidade'> = [
    'Compra do mês', 'Compra da semana', 'Compra de necessidade',
  ];

  // Carregar itens ao abrir
  useEffect(() => {
    carregar<Item[]>('itens_mercado').then(dados => {
      if (dados) setItems(dados);
    });
  }, []);

  // Salvar sempre que mudar
  useEffect(() => {
    salvar('itens_mercado', items);
  }, [items]);

  const filteredItems = items.filter(item => selectedCategories.has(item.category));
  const itemsToShop = filteredItems.filter(item => !item.collected);
  const itemsCollected = filteredItems.filter(item => item.collected);

  const handleAddItem = () => {
    if (!formName.trim()) { setModalVisible(false); return; }
    setItems(prev => {
      if (editingItemId) {
        return prev.map(item => item.id === editingItemId ? { ...item, name: formName, quantity: formQuantity, category: formCategory } : item);
      }
      return [...prev, { id: Date.now().toString(), name: formName, quantity: formQuantity, category: formCategory, collected: false }];
    });
    setModalVisible(false);
    setEditingItemId(null);
    setFormName('');
    setFormQuantity('');
    setFormCategory('Compra da semana');
  };

  const handleDeleteItem = (id: string) => { setItems(prev => prev.filter(item => item.id !== id)); };

  const handleToggleItem = (id: string) => {
    setItems(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, collected: !item.collected } : item);
      const filteredUpdated = updated.filter(item => selectedCategories.has(item.category));
      const allCollected = filteredUpdated.length > 0 && filteredUpdated.every(item => item.collected);
      if (allCollected) setTimeout(() => setCompletionModalVisible(true), 300);
      return updated;
    });
  };

  const openEditModal = (item: Item) => {
    setEditingItemId(item.id); setFormName(item.name); setFormQuantity(item.quantity); setFormCategory(item.category); setModalVisible(true);
  };

  const openNewModal = () => {
    setEditingItemId(null); setFormName(''); setFormQuantity(''); setFormCategory('Compra da semana'); setModalVisible(true);
  };

  const toggleCategory = (category: string) => {
    const newSet = new Set(selectedCategories);
    if (newSet.has(category)) newSet.delete(category); else newSet.add(category);
    setSelectedCategories(newSet);
  };

  const resetCollected = () => {
    setItems(prev => prev.map(item => (selectedCategories.has(item.category) ? { ...item, collected: false } : item)));
    setCompletionModalVisible(false);
    setIsShoppingMode(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mercado</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openNewModal}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll} contentContainerStyle={styles.categoriesContent}>
        {categories.map(category => (
          <TouchableOpacity key={category} style={[styles.categoryButton, selectedCategories.has(category) && styles.categoryButtonActive]} onPress={() => toggleCategory(category)}>
            <Text style={[styles.categoryButtonText, selectedCategories.has(category) && styles.categoryButtonTextActive]}>{category}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.modeContainer}>
        <TouchableOpacity style={[styles.modeButton, isShoppingMode && styles.modeButtonActive]} onPress={() => setIsShoppingMode(!isShoppingMode)}>
          <Text style={[styles.modeButtonText, isShoppingMode && styles.modeButtonTextActive]}>{isShoppingMode ? '✓ Estou no Mercado' : 'Estou no Mercado'}</Text>
        </TouchableOpacity>
      </View>

      {isShoppingMode && filteredItems.length > 0 && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>{itemsCollected.length} de {filteredItems.length} itens coletados</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(itemsCollected.length / filteredItems.length) * 100}%` }]} />
          </View>
        </View>
      )}

      <ScrollView style={styles.content}>
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}><Text style={styles.emptyText}>Nenhum item nessas categorias</Text></View>
        ) : (
          filteredItems.map(item => (
            <TouchableOpacity key={item.id} style={[styles.itemCard, isShoppingMode && styles.itemCardClickable, item.collected && styles.itemCardCollected]} onPress={() => isShoppingMode && handleToggleItem(item.id)} activeOpacity={isShoppingMode ? 0.7 : 1}>
              {isShoppingMode && (
                <View style={styles.checkbox}>{item.collected && <Text style={styles.checkmark}>✓</Text>}</View>
              )}
              <View style={[styles.itemInfo, isShoppingMode && { marginLeft: 10 }]}>
                <Text style={[styles.itemName, item.collected && styles.itemNameCollected]}>{item.name}</Text>
                <View style={styles.itemMeta}>
                  {item.quantity && <Text style={styles.itemQuantity}>{item.quantity}</Text>}
                  <Text style={styles.itemCategory}>{item.category}</Text>
                </View>
              </View>
              {!isShoppingMode && (
                <>
                  <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editIcon}><Text>✏️</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteItem(item.id)}><Text style={styles.deleteIcon}>🗑️</Text></TouchableOpacity>
                </>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItemId ? 'Editar item' : 'Novo item'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.closeModal}>✕</Text></TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Produto</Text>
                <TextInput style={styles.input} placeholder="Ex: Arroz, Leite..." value={formName} onChangeText={setFormName} placeholderTextColor="#ccc" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Quantidade (opcional)</Text>
                <TextInput style={styles.input} placeholder="Ex: 2kg, 1L..." value={formQuantity} onChangeText={setFormQuantity} placeholderTextColor="#ccc" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Categoria</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {categories.map(cat => (
                    <TouchableOpacity key={cat} style={[styles.categorySelectButton, formCategory === cat && styles.categorySelectButtonActive]} onPress={() => setFormCategory(cat)}>
                      <Text style={[styles.categorySelectText, formCategory === cat && styles.categorySelectTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelBtnText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddItem}><Text style={styles.confirmBtnText}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={completionModalVisible} transparent animationType="fade" onRequestClose={() => setCompletionModalVisible(false)}>
        <View style={styles.completionOverlay}>
          <View style={styles.completionModal}>
            <Text style={styles.completionEmoji}>🎉</Text>
            <Text style={styles.completionTitle}>Parabéns!</Text>
            <Text style={styles.completionText}>Todos os itens foram colocados no carrinho!</Text>
            <TouchableOpacity style={styles.completionBtn} onPress={resetCollected}><Text style={styles.completionBtnText}>Pronto</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#a89080' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#a89080' },
  backBtn: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#d4c5b9', justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: '#2a2a2a', fontWeight: 'bold' },
  headerTitle: { fontSize: 24, fontWeight: '300', fontStyle: 'italic', color: '#2a2a2a' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#c9a876', justifyContent: 'center', alignItems: 'center' },
  addIcon: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
  categoriesScroll: { backgroundColor: '#a89080', maxHeight: 50 },
  categoriesContent: { paddingHorizontal: 15, paddingVertical: 8, gap: 8 },
  categoryButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.3)' },
  categoryButtonActive: { backgroundColor: '#c9a876' },
  categoryButtonText: { fontSize: 12, color: '#2a2a2a', fontWeight: '500' },
  categoryButtonTextActive: { color: '#fff' },
  modeContainer: { paddingHorizontal: 15, paddingVertical: 10 },
  modeButton: { backgroundColor: '#e8dcc8', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  modeButtonActive: { backgroundColor: '#c9a876', borderColor: '#2a2a2a' },
  modeButtonText: { fontSize: 14, fontWeight: '600', color: '#2a2a2a' },
  modeButtonTextActive: { color: '#fff' },
  progressContainer: { paddingHorizontal: 15, paddingVertical: 10 },
  progressText: { fontSize: 12, color: '#2a2a2a', marginBottom: 6, fontWeight: '600' },
  progressBar: { height: 8, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#c9a876' },
  content: { flex: 1, paddingHorizontal: 15, paddingVertical: 10 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
  emptyText: { fontSize: 16, color: '#666', fontStyle: 'italic' },
  itemCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemCardClickable: { backgroundColor: '#f9f9f9', borderWidth: 2, borderColor: 'transparent' },
  itemCardCollected: { backgroundColor: '#f0f0f0', borderColor: '#c9a876' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#c9a876', justifyContent: 'center', alignItems: 'center' },
  checkmark: { fontSize: 14, color: '#c9a876', fontWeight: 'bold' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#2a2a2a', marginBottom: 4 },
  itemNameCollected: { color: '#999', textDecorationLine: 'line-through' },
  itemMeta: { flexDirection: 'row', gap: 8 },
  itemQuantity: { fontSize: 11, color: '#999' },
  itemCategory: { fontSize: 10, color: '#bbb', fontStyle: 'italic' },
  editIcon: { marginRight: 10, fontSize: 18 },
  deleteIcon: { fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#2a2a2a' },
  closeModal: { fontSize: 24, color: '#999' },
  modalBody: { paddingHorizontal: 20, paddingTop: 10 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#2a2a2a', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#2a2a2a' },
  categoryScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  categorySelectButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f0f0f0', marginRight: 8 },
  categorySelectButtonActive: { backgroundColor: '#c9a876' },
  categorySelectText: { fontSize: 12, fontWeight: '500', color: '#2a2a2a' },
  categorySelectTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 15, paddingBottom: 20 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#2a2a2a' },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#c9a876', alignItems: 'center' },
  confirmBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  completionOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' },
  completionModal: { backgroundColor: '#fff', borderRadius: 20, padding: 30, alignItems: 'center', width: '80%' },
  completionEmoji: { fontSize: 60, marginBottom: 20 },
  completionTitle: { fontSize: 24, fontWeight: '700', color: '#2a2a2a', marginBottom: 10 },
  completionText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  completionBtn: { backgroundColor: '#c9a876', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 10 },
  completionBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

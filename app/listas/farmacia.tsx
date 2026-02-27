import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { salvar, carregar } from '../../utils/storage';

interface Item {
  id: string;
  name: string;
  quantity: string;
}

export default function FarmaciaScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formQuantity, setFormQuantity] = useState('');

  // Carregar itens ao abrir
  useEffect(() => {
    carregar<Item[]>('itens_farmacia').then(dados => {
      if (dados) setItems(dados);
    });
  }, []);

  // Salvar sempre que mudar
  useEffect(() => {
    salvar('itens_farmacia', items);
  }, [items]);

  const handleAddItem = () => {
    if (!formName.trim()) { setModalVisible(false); return; }
    setItems(prev => {
      if (editingItemId) {
        return prev.map(item => item.id === editingItemId ? { ...item, name: formName, quantity: formQuantity } : item);
      }
      return [...prev, { id: Date.now().toString(), name: formName, quantity: formQuantity }];
    });
    setModalVisible(false);
    setEditingItemId(null);
    setFormName('');
    setFormQuantity('');
  };

  const handleDeleteItem = (id: string) => { setItems(prev => prev.filter(item => item.id !== id)); };

  const openEditModal = (item: Item) => {
    setEditingItemId(item.id); setFormName(item.name); setFormQuantity(item.quantity); setModalVisible(true);
  };

  const openNewModal = () => {
    setEditingItemId(null); setFormName(''); setFormQuantity(''); setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Farmácia</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openNewModal}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {items.length === 0 ? (
          <View style={styles.emptyState}><Text style={styles.emptyText}>Nenhum item adicionado</Text></View>
        ) : (
          items.map(item => (
            <TouchableOpacity key={item.id} style={styles.itemCard} onPress={() => openEditModal(item)} activeOpacity={0.7}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.quantity && <Text style={styles.itemQuantity}>{item.quantity}</Text>}
              </View>
              <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
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
                <TextInput style={styles.input} placeholder="Ex: Dipirona, Band-aid..." value={formName} onChangeText={setFormName} placeholderTextColor="#ccc" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Quantidade (opcional)</Text>
                <TextInput style={styles.input} placeholder="Ex: 1 caixa, 2 unidades..." value={formQuantity} onChangeText={setFormQuantity} placeholderTextColor="#ccc" />
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelBtnText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddItem}><Text style={styles.confirmBtnText}>Salvar</Text></TouchableOpacity>
            </View>
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
  content: { flex: 1, paddingHorizontal: 15, paddingVertical: 20 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
  emptyText: { fontSize: 16, color: '#666', fontStyle: 'italic' },
  itemCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#2a2a2a', marginBottom: 4 },
  itemQuantity: { fontSize: 12, color: '#999' },
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
  modalActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 15, paddingBottom: 20 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#2a2a2a' },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#c9a876', alignItems: 'center' },
  confirmBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { salvar, carregar } from '../utils/storage';

interface Note {
  id: string;
  subject: string;
  date: string;
}

type PetKey = 'Arya' | 'Sansa' | 'Stan';

export default function PetsScreen() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notesByPet, setNotesByPet] = useState<Record<PetKey, Note[]>>({ Arya: [], Sansa: [], Stan: [] });
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPet, setCurrentPet] = useState<PetKey>('Arya');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [formSubject, setFormSubject] = useState('');
  const [formDate, setFormDate] = useState('');

  // Carregar notas ao abrir
  useEffect(() => {
    carregar<Record<PetKey, Note[]>>('pets_notas').then(dados => {
      if (dados) setNotesByPet(dados);
    });
  }, []);

  // Salvar sempre que mudar
  useEffect(() => {
    salvar('pets_notas', notesByPet);
  }, [notesByPet]);

  const openNewNote = (pet: PetKey) => {
    setCurrentPet(pet); setEditingNoteId(null); setFormSubject(''); setFormDate(''); setModalVisible(true);
  };

  const openEditNote = (pet: PetKey, note: Note) => {
    setCurrentPet(pet); setEditingNoteId(note.id); setFormSubject(note.subject); setFormDate(note.date); setModalVisible(true);
  };

  const handleSaveNote = () => {
    if (!formSubject.trim() && !formDate.trim()) { setModalVisible(false); return; }
    setNotesByPet(prev => {
      const petNotes = prev[currentPet] || [];
      if (editingNoteId) {
        return { ...prev, [currentPet]: petNotes.map(n => n.id === editingNoteId ? { ...n, subject: formSubject, date: formDate } : n) };
      }
      return { ...prev, [currentPet]: [...petNotes, { id: Date.now().toString(), subject: formSubject, date: formDate }] };
    });
    setModalVisible(false);
    setEditingNoteId(null);
    setFormSubject('');
    setFormDate('');
  };

  const handleDeleteNote = (pet: PetKey, id: string) => {
    setNotesByPet(prev => ({ ...prev, [pet]: prev[pet].filter(n => n.id !== id) }));
  };

  const PetBlock = ({ pet }: { pet: PetKey }) => (
    <View style={styles.petBlock}>
      <Text style={styles.petName}>{pet}</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 2 }]}>Assunto</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Data</Text>
        <Text style={[styles.tableHeaderText, { width: 40 }]} />
      </View>
      {notesByPet[pet].map(note => (
        <TouchableOpacity key={note.id} style={styles.tableRow} onPress={() => openEditNote(pet, note)} activeOpacity={0.7}>
          <Text style={[styles.cellText, { flex: 2 }]}>{note.subject}</Text>
          <Text style={[styles.cellText, { flex: 1 }]}>{note.date}</Text>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteNote(pet, note.id)}>
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.addNoteBtn} onPress={() => openNewNote(pet)}>
        <Text style={styles.addNoteText}>+ adicionar linha</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pets</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <PetBlock pet="Arya" />
        <PetBlock pet="Sansa" />
        <PetBlock pet="Stan" />
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingNoteId ? 'Editar anotação' : 'Nova anotação'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.closeModal}>✕</Text></TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalPetName}>{currentPet}</Text>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Assunto</Text>
                <TextInput style={styles.formInput} placeholder="Ex: Vacina, banho, remédio..." value={formSubject} onChangeText={setFormSubject} placeholderTextColor="#ccc" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Data</Text>
                <TextInput style={styles.formInput} placeholder="Ex: 05/02/2026" value={formDate} onChangeText={setFormDate} placeholderTextColor="#ccc" />
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelBtnText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveNote}><Text style={styles.confirmBtnText}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {menuOpen && (
        <TouchableOpacity style={styles.overlay} onPress={() => setMenuOpen(false)} activeOpacity={1}>
          <View style={styles.sideMenu}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setMenuOpen(false)}><Text style={styles.closeIcon}>✕</Text></TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); router.push('/home'); }}><Text style={styles.menuText}>Página Inicial</Text></TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); router.push('/listas'); }}><Text style={styles.menuText}>Listas</Text></TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); router.push('/afazeres'); }}><Text style={styles.menuText}>Afazeres de casa</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#a89080' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#a89080' },
  menuBtn: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#d4c5b9', justifyContent: 'center', alignItems: 'center' },
  menuIcon: { fontSize: 24, color: '#2a2a2a', fontWeight: 'bold' },
  headerTitle: { fontSize: 24, fontWeight: '300', fontStyle: 'italic', color: '#2a2a2a', letterSpacing: 1 },
  content: { paddingHorizontal: 15, paddingVertical: 20, gap: 20 },
  petBlock: { backgroundColor: '#b69372', borderRadius: 20, padding: 14 },
  petName: { fontSize: 18, fontWeight: '600', color: '#2a2a2a', marginBottom: 10 },
  tableHeader: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.2)', marginBottom: 4 },
  tableHeaderText: { fontSize: 12, fontWeight: '700', color: '#2a2a2a' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.08)' },
  cellText: { fontSize: 12, color: '#2a2a2a' },
  deleteBtn: { width: 40, alignItems: 'center' },
  deleteIcon: { fontSize: 16 },
  addNoteBtn: { marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: '#e8dcc8' },
  addNoteText: { fontSize: 12, color: '#2a2a2a' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#2a2a2a' },
  closeModal: { fontSize: 24, color: '#999' },
  modalBody: { paddingHorizontal: 20, paddingTop: 10 },
  modalPetName: { fontSize: 16, fontWeight: '600', color: '#2a2a2a', marginBottom: 12 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '600', color: '#2a2a2a', marginBottom: 6 },
  formInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#2a2a2a' },
  modalActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#2a2a2a' },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#c9a876', alignItems: 'center' },
  confirmBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  sideMenu: { position: 'absolute', top: 0, left: 0, width: '65%', height: '100%', backgroundColor: '#6f5947', paddingTop: 20 },
  closeBtn: { paddingHorizontal: 20, paddingVertical: 10 },
  closeIcon: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
  menuItem: { paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.2)' },
  menuText: { fontSize: 16, color: '#fff', fontWeight: '500' },
});

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Timestamp } from 'firebase/firestore';
import { usePets } from '@/hooks/usePets';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { PERSON_PROFILES } from '@/constants/personProfiles';
import type { PetNote } from '@/types/database';

type PetKey = 'Arya' | 'Oliver' | 'Aurora' | 'Nico' | 'Stan';

export default function PetsScreen() {
  const insets = useSafeAreaInsets();
  const { pets, saveNotes } = usePets();
  const { activeProfileId } = useActiveProfile();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPet, setCurrentPet] = useState<PetKey>('Arya');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [formSubject, setFormSubject] = useState('');
  const [formDate, setFormDate] = useState('');

  const getNotes = (pet: PetKey): PetNote[] => pets.find(p => p.name === pet)?.notes ?? [];

  const openNewNote = (pet: PetKey) => {
    setCurrentPet(pet); setEditingNoteId(null); setFormSubject(''); setFormDate(''); setModalVisible(true);
  };

  const openEditNote = (pet: PetKey, note: PetNote) => {
    setCurrentPet(pet); setEditingNoteId(note.id); setFormSubject(note.subject); setFormDate(note.date); setModalVisible(true);
  };

  const handleSaveNote = async () => {
    if (!formSubject.trim() && !formDate.trim()) { setModalVisible(false); return; }
    const petNotes = getNotes(currentPet);
    const nextNotes = editingNoteId
      ? petNotes.map(n => n.id === editingNoteId ? { ...n, subject: formSubject, date: formDate } : n)
      : [
          ...petNotes,
          {
            id: Date.now().toString(),
            subject: formSubject,
            date: formDate,
            createdBy: activeProfileId ?? 'guilherme',
            createdByName: activeProfileId ? PERSON_PROFILES[activeProfileId].name : '',
            createdAt: Timestamp.now(),
          },
        ];
    await saveNotes(currentPet.toLowerCase(), nextNotes);
    setModalVisible(false);
    setEditingNoteId(null);
    setFormSubject('');
    setFormDate('');
  };

  const handleDeleteNote = (pet: PetKey, id: string) => {
    saveNotes(pet.toLowerCase(), getNotes(pet).filter(n => n.id !== id));
  };

  const PetBlock = ({ pet }: { pet: PetKey }) => (
    <View style={styles.petBlock}>
      <Text style={styles.petName}>{pet}</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 2 }]}>Assunto</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Data</Text>
        <Text style={[styles.tableHeaderText, { width: 40 }]} />
      </View>
      {getNotes(pet).map(note => (
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
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <Text style={styles.headerTitle}>Pets</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <PetBlock pet="Arya" />
        <PetBlock pet="Oliver" />
        <PetBlock pet="Aurora" />
        <PetBlock pet="Nico" />
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

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#a89080' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#a89080' },
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
});

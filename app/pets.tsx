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
import { casa } from '@/constants/casaStyles';
import { showConfirm } from '@/utils/alert';
import { Casa, HEADER_MENU_SLOT, Radius, Sheet, Spacing, shadow } from '@/constants/design';
import type { PetNote } from '@/types/database';

type PetKey = 'Arya' | 'Oliver' | 'Aurora' | 'Nico' | 'Stan';

/** Inicial do nome no lugar de um ícone genérico: identifica o bicho sem
 *  inventar espécie nem repetir a mesma figurinha cinco vezes. */
const initial = (pet: PetKey) => pet.charAt(0);

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

  const handleDeleteNote = (pet: PetKey, note: PetNote) => {
    showConfirm(
      {
        title: 'Excluir anotação',
        message: `Excluir "${note.subject}" de ${pet}? Isso não tem como desfazer.`,
        confirmText: 'Excluir',
        destructive: true,
      },
      () => { saveNotes(pet.toLowerCase(), getNotes(pet).filter(n => n.id !== note.id)); }
    );
  };

  const PetBlock = ({ pet }: { pet: PetKey }) => {
    const notes = getNotes(pet);
    return (
      <View style={styles.petBlock}>
        <View style={styles.petHeader}>
          <View style={styles.petAvatar}>
            <Text style={styles.petInitial}>{initial(pet)}</Text>
          </View>
          <Text style={styles.petName}>{pet}</Text>
          <Text style={styles.petCount}>
            {notes.length} {notes.length === 1 ? 'anotação' : 'anotações'}
          </Text>
        </View>

        {notes.length > 0 && (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colSubject]}>Assunto</Text>
              <Text style={[styles.tableHeaderText, styles.colDate]}>Data</Text>
              <View style={styles.colActions} />
            </View>
            {notes.map(note => (
              <TouchableOpacity key={note.id} style={styles.tableRow} onPress={() => openEditNote(pet, note)} activeOpacity={0.7}>
                <Text style={[styles.cellText, styles.colSubject]} numberOfLines={2}>{note.subject}</Text>
                <Text style={[styles.cellDate, styles.colDate]}>{note.date}</Text>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteNote(pet, note)} accessibilityRole="button" accessibilityLabel={`Excluir ${note.subject}`} activeOpacity={0.6}>
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.addNoteBtn} onPress={() => openNewNote(pet)} activeOpacity={0.75}>
          <Text style={styles.addNoteText}>+ adicionar anotação</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={casa.container}>
      <View style={[casa.header, styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={casa.headerTitleFlex}>Pets</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PetBlock pet="Arya" />
        <PetBlock pet="Oliver" />
        <PetBlock pet="Aurora" />
        <PetBlock pet="Nico" />
        <PetBlock pet="Stan" />
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={casa.modalOverlay}>
          <View style={casa.modalContent}>
            <View style={casa.modalGrabber} />
            <View style={casa.modalHeader}>
              <Text style={casa.modalTitle}>{editingNoteId ? 'Editar anotação' : 'Nova anotação'}</Text>
              <TouchableOpacity style={casa.closeModal} onPress={() => setModalVisible(false)} activeOpacity={0.6}>
                <Text style={casa.closeModalIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={casa.modalBody}>
              <View style={styles.modalPetRow}>
                <Text style={styles.modalPetInitial}>{initial(currentPet)}</Text>
                <Text style={styles.modalPetName}>{currentPet}</Text>
              </View>
              <View style={casa.formGroup}>
                <Text style={casa.formLabel}>Assunto</Text>
                <TextInput style={casa.formInput} placeholder="Ex: vacina, banho, remédio..." value={formSubject} onChangeText={setFormSubject} placeholderTextColor={Sheet.placeholder} />
              </View>
              <View style={casa.formGroup}>
                <Text style={casa.formLabel}>Data</Text>
                <TextInput style={casa.formInput} placeholder="Ex: 05/02/2026" value={formDate} onChangeText={setFormDate} placeholderTextColor={Sheet.placeholder} />
              </View>
            </View>
            <View style={casa.modalActions}>
              <TouchableOpacity style={casa.cancelBtn} onPress={() => setModalVisible(false)} activeOpacity={0.7}><Text style={casa.cancelBtnText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={casa.confirmBtn} onPress={handleSaveNote} activeOpacity={0.85}><Text style={casa.confirmBtnText}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingRight: HEADER_MENU_SLOT },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl, gap: Spacing.lg },
  petBlock: {
    backgroundColor: Casa.surfaceWarm,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...shadow(1),
  },
  petHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  petAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Casa.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petInitial: { fontSize: 16, lineHeight: 20, fontWeight: '700', color: Casa.accent },
  petName: { flex: 1, fontSize: 17, fontWeight: '600', color: Casa.ink },
  petCount: { fontSize: 11, fontWeight: '600', color: Casa.inkMuted },
  table: { backgroundColor: Casa.surface, borderRadius: Radius.sm, overflow: 'hidden' },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Casa.surfaceSunken,
    gap: Spacing.sm + 2,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: Casa.inkMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Casa.line,
    gap: Spacing.sm + 2,
  },
  /** Mesmas larguras no cabeçalho e nas linhas — é isso que mantém as
   *  colunas da tabela no prumo. */
  colSubject: { flex: 2 },
  colDate: { flex: 1 },
  colActions: { width: 30 },
  cellText: { fontSize: 13, color: Casa.ink, fontWeight: '500' },
  cellDate: { fontSize: 12, color: Casa.inkMuted, fontWeight: '600' },
  deleteBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  deleteIcon: { fontSize: 14, lineHeight: 17 },
  addNoteBtn: {
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Casa.surface,
  },
  addNoteText: { fontSize: 12, color: Casa.ink, fontWeight: '600' },
  modalPetRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  modalPetInitial: { fontSize: 15, lineHeight: 24, fontWeight: '700', color: Casa.accent, width: 28, height: 28, borderRadius: 14, backgroundColor: Casa.surfaceSunken, textAlign: 'center', overflow: 'hidden' },
  modalPetName: { fontSize: 16, fontWeight: '700', color: Sheet.title },
});

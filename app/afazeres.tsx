import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import {
  useSharedActivities,
  relevantDateKeyForToday,
  isCompletedOnDate,
  getOccurrenceHistory,
  getOverdueForCreator,
  type ActivityOccurrence,
} from '@/hooks/useSharedActivities';
import { normalizeDateInput } from '@/utils/dates';
import { showAlert, showConfirm } from '@/utils/alert';
import { salvar, carregar } from '@/utils/storage';
import { notifyMissedTask } from '@/services/notifications';
import { PERSON_ORDER, PERSON_PROFILES } from '@/constants/personProfiles';
import type { ActivityFrequency, PersonId, SharedActivity } from '@/types/database';

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const NOTIFIED_MISSED_KEY = 'notifiedMissedOccurrences';

function frequencyLabel(activity: SharedActivity): string {
  if (activity.frequency === 'once') return activity.date ?? '—';
  if (activity.frequency === 'daily') return 'Todo dia';
  const daysOfWeek = activity.daysOfWeek ?? [];
  if (daysOfWeek.length === 0) return 'Semanalmente';
  return daysOfWeek
    .slice()
    .sort((a, b) => a - b)
    .map((d) => `Toda ${WEEKDAY_LABELS[d]}`)
    .join(', ');
}

function occurrenceLabel(occurrence: ActivityOccurrence): string {
  const weekday = WEEKDAY_LABELS[occurrence.date.getDay()];
  const day = String(occurrence.date.getDate()).padStart(2, '0');
  const month = String(occurrence.date.getMonth() + 1).padStart(2, '0');
  return `${weekday}, ${day}/${month}`;
}

function occurrenceStatusIcon(status: ActivityOccurrence['status']): string {
  if (status === 'completed') return '✅';
  if (status === 'missed') return '❌';
  return '⏳';
}

function occurrenceStatusDetail(occurrence: ActivityOccurrence): string {
  if (occurrence.status === 'missed') return 'não concluído';
  if (occurrence.status === 'pending') return 'pendente';
  const completion = occurrence.completion;
  if (!completion) return 'concluído';
  const time = completion.completedAt?.toDate
    ? completion.completedAt.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;
  const who = completion.completedByName ? ` por ${completion.completedByName}` : '';
  return time ? `concluído${who} às ${time}` : `concluído${who}`;
}

export default function AfazeresScreen() {
  const insets = useSafeAreaInsets();
  const { activeProfileId } = useActiveProfile();
  const { activities, loading, addActivity, deleteActivity, toggleCompletion } = useSharedActivities();

  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterResponsible, setFilterResponsible] = useState<PersonId | 'Todos'>('Todos');
  const [filterStatus, setFilterStatus] = useState<'Todas' | 'Pendente' | 'Concluído'>('Todas');

  const [formTitle, setFormTitle] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState<PersonId>(PERSON_ORDER[0]);
  const [formFrequency, setFormFrequency] = useState<ActivityFrequency>('once');
  const [formDaysOfWeek, setFormDaysOfWeek] = useState<number[]>([]);
  const [formDate, setFormDate] = useState('');
  const [trackingActivity, setTrackingActivity] = useState<SharedActivity | null>(null);

  const activeProfile = activeProfileId ? PERSON_PROFILES[activeProfileId] : null;

  // Runs whenever Afazeres is opened: for every recurring task the current
  // profile created for someone else, check for occurrences that already
  // passed without a completion recorded, and fire a local notification —
  // once per missed occurrence, tracked in AsyncStorage so re-opening the
  // screen doesn't re-notify for the same date.
  useEffect(() => {
    if (!activeProfileId || loading) return;
    const overdue = getOverdueForCreator(activities, activeProfileId);
    if (overdue.length === 0) return;

    (async () => {
      const notified = (await carregar<string[]>(NOTIFIED_MISSED_KEY)) ?? [];
      const notifiedSet = new Set(notified);
      let changed = false;

      for (const { activity, missedDates } of overdue) {
        const responsibleName = activity.assignedTo ? PERSON_PROFILES[activity.assignedTo].name : '';
        for (const dateKey of missedDates) {
          const flagKey = `${activity.id}|${dateKey}`;
          if (notifiedSet.has(flagKey)) continue;
          notifiedSet.add(flagKey);
          changed = true;
          await notifyMissedTask(responsibleName, activity.title, dateKey);
        }
      }

      if (changed) {
        await salvar(NOTIFIED_MISSED_KEY, Array.from(notifiedSet));
      }
    })();
  }, [activities, activeProfileId, loading]);

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const title = activity.title?.toLowerCase() ?? '';
      const search = searchText.toLowerCase();
      const matchesSearch = title.includes(search);
      const matchesResponsible = filterResponsible === 'Todos' || activity.assignedTo === filterResponsible;
      const completedToday = isCompletedOnDate(activity, relevantDateKeyForToday(activity));
      const matchesStatus =
        filterStatus === 'Todas' ||
        (filterStatus === 'Concluído' && completedToday) ||
        (filterStatus === 'Pendente' && !completedToday);
      return matchesSearch && matchesResponsible && matchesStatus;
    });
  }, [activities, searchText, filterResponsible, filterStatus]);

  const resetForm = () => {
    setFormTitle('');
    setFormAssignedTo(PERSON_ORDER[0]);
    setFormFrequency('once');
    setFormDaysOfWeek([]);
    setFormDate('');
  };

  const toggleFormDay = (day: number) => {
    setFormDaysOfWeek((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const handleAddActivity = async () => {
    if (!formTitle.trim()) {
      showAlert('Erro', 'Por favor, preencha o título da tarefa');
      return;
    }
    if (formFrequency === 'once' && !normalizeDateInput(formDate)) {
      showAlert('Erro', 'Informe uma data válida (DD/MM/AAAA)');
      return;
    }
    if (formFrequency === 'weekly' && formDaysOfWeek.length === 0) {
      showAlert('Erro', 'Selecione ao menos um dia da semana');
      return;
    }
    if (!activeProfileId || !activeProfile) return;

    await addActivity({
      title: formTitle,
      description: '',
      assignedTo: formAssignedTo,
      frequency: formFrequency,
      daysOfWeek: formFrequency === 'weekly' ? formDaysOfWeek : [],
      date: formFrequency === 'once' ? normalizeDateInput(formDate) : null,
      createdBy: activeProfileId,
      createdByName: activeProfile.name,
    });
    resetForm();
    setModalVisible(false);
  };

  const handleToggle = (activity: SharedActivity) => {
    if (!activeProfileId || !activeProfile) return;
    toggleCompletion(activity, relevantDateKeyForToday(activity), activeProfileId, activeProfile.name);
  };

  const handleDelete = (id: string) => {
    showConfirm(
      { title: 'Excluir tarefa', message: 'Tem certeza que deseja excluir esta tarefa?', confirmText: 'Excluir', destructive: true },
      () => deleteActivity(id)
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <Text style={styles.headerTitle}>Afazeres</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput style={styles.searchInput} placeholder="Pesquisar tarefa..." placeholderTextColor="#999" value={searchText} onChangeText={setSearchText} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersContent}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Status:</Text>
          {(['Todas', 'Pendente', 'Concluído'] as const).map((status) => (
            <TouchableOpacity key={status} style={[styles.filterBtn, filterStatus === status && styles.filterBtnActive]} onPress={() => setFilterStatus(status)}>
              <Text style={[styles.filterBtnText, filterStatus === status && styles.filterBtnTextActive]}>{status}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Responsável:</Text>
          <TouchableOpacity style={[styles.filterBtn, filterResponsible === 'Todos' && styles.filterBtnActive]} onPress={() => setFilterResponsible('Todos')}>
            <Text style={[styles.filterBtnText, filterResponsible === 'Todos' && styles.filterBtnTextActive]}>Todos</Text>
          </TouchableOpacity>
          {PERSON_ORDER.map((id) => (
            <TouchableOpacity key={id} style={[styles.filterBtn, filterResponsible === id && styles.filterBtnActive]} onPress={() => setFilterResponsible(id)}>
              <Text style={[styles.filterBtnText, filterResponsible === id && styles.filterBtnTextActive]}>{PERSON_PROFILES[id].name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView style={styles.tasksList}>
        {!loading && filteredActivities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhuma tarefa encontrada</Text>
            {activities.length > 0 && <Text style={styles.emptySubtext}>Tente ajustar os filtros</Text>}
          </View>
        ) : (
          filteredActivities.map((activity) => {
            const responsible = activity.assignedTo ? PERSON_PROFILES[activity.assignedTo] : null;
            const completedToday = isCompletedOnDate(activity, relevantDateKeyForToday(activity));
            const canTrack = activeProfileId === activity.createdBy && activity.createdBy !== activity.assignedTo;
            return (
              <View key={activity.id} style={[styles.taskCard, completedToday && styles.taskCardCompleted]}>
                <TouchableOpacity style={styles.taskContent} onPress={() => handleToggle(activity)}>
                  <View style={[styles.taskCheckbox, responsible && { borderColor: responsible.colors.primary }]}>
                    {completedToday && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, completedToday && styles.taskTitleCompleted]}>{activity.title}</Text>
                    <View style={styles.taskMeta}>
                      {responsible && (
                        <View style={[styles.responsibleBadge, { backgroundColor: responsible.colors.primary }]}>
                          <Text style={[styles.responsibleBadgeText, { color: responsible.colors.secondary }]}>{responsible.name}</Text>
                        </View>
                      )}
                      <Text style={styles.dateText}>🔁 {frequencyLabel(activity)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <View style={styles.taskActions}>
                  {canTrack && (
                    <TouchableOpacity style={styles.trackBtn} onPress={() => setTrackingActivity(activity)}>
                      <Text style={styles.trackIcon}>📊</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(activity.id)}>
                    <Text style={styles.deleteIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={trackingActivity !== null} transparent animationType="slide" onRequestClose={() => setTrackingActivity(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Acompanhamento</Text>
              <TouchableOpacity onPress={() => setTrackingActivity(null)}><Text style={styles.closeModal}>✕</Text></TouchableOpacity>
            </View>
            {trackingActivity && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.trackingTitle}>{trackingActivity.title}</Text>
                <Text style={styles.trackingSubtitle}>
                  Responsável: {trackingActivity.assignedTo ? PERSON_PROFILES[trackingActivity.assignedTo].name : '—'}
                </Text>
                {getOccurrenceHistory(trackingActivity)
                  .slice()
                  .reverse()
                  .map((occurrence) => (
                    <View key={occurrence.dateKey} style={styles.occurrenceRow}>
                      <Text style={styles.occurrenceIcon}>{occurrenceStatusIcon(occurrence.status)}</Text>
                      <Text style={styles.occurrenceLabel}>{occurrenceLabel(occurrence)}</Text>
                      <Text style={styles.occurrenceStatus}>{occurrenceStatusDetail(occurrence)}</Text>
                    </View>
                  ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Tarefa</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}><Text style={styles.closeModal}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Título *</Text>
                <TextInput style={styles.formInput} placeholder="O que precisa ser feito?" value={formTitle} onChangeText={setFormTitle} placeholderTextColor="#ccc" />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Responsável</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.peopleScroll}>
                  {PERSON_ORDER.map((id) => (
                    <TouchableOpacity
                      key={id}
                      style={[styles.peopleOption, formAssignedTo === id && { backgroundColor: PERSON_PROFILES[id].colors.primary }]}
                      onPress={() => setFormAssignedTo(id)}
                    >
                      <Text style={[styles.peopleOptionText, formAssignedTo === id && { color: PERSON_PROFILES[id].colors.secondary }]}>
                        {PERSON_PROFILES[id].name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Frequência</Text>
                <View style={styles.frequencyRow}>
                  {([
                    ['once', 'Uma vez'],
                    ['daily', 'Diariamente'],
                    ['weekly', 'Semanalmente'],
                  ] as const).map(([value, label]) => (
                    <TouchableOpacity
                      key={value}
                      style={[styles.categoryOption, formFrequency === value && styles.categoryOptionActive]}
                      onPress={() => setFormFrequency(value)}
                    >
                      <Text style={[styles.categoryOptionText, formFrequency === value && styles.categoryOptionTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {formFrequency === 'once' && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Data</Text>
                  <TextInput style={styles.formInput} placeholder="DD/MM/AAAA" value={formDate} onChangeText={setFormDate} placeholderTextColor="#ccc" />
                </View>
              )}

              {formFrequency === 'weekly' && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Dias da semana</Text>
                  <View style={styles.frequencyRow}>
                    {WEEKDAY_LABELS.map((label, index) => (
                      <TouchableOpacity
                        key={label}
                        style={[styles.categoryOption, formDaysOfWeek.includes(index) && styles.categoryOptionActive]}
                        onPress={() => toggleFormDay(index)}
                      >
                        <Text style={[styles.categoryOptionText, formDaysOfWeek.includes(index) && styles.categoryOptionTextActive]}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); resetForm(); }}><Text style={styles.cancelBtnText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddActivity}><Text style={styles.confirmBtnText}>Adicionar</Text></TouchableOpacity>
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
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#c9a876', justifyContent: 'center', alignItems: 'center', marginRight: 44 },
  addIcon: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
  searchContainer: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#a89080' },
  searchInput: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, fontSize: 14, color: '#2a2a2a' },
  filtersScroll: { maxHeight: 90, backgroundColor: '#a89080' },
  filtersContent: { paddingHorizontal: 15, paddingVertical: 8, gap: 20 },
  filterGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterLabel: { fontSize: 12, fontWeight: '600', color: '#2a2a2a' },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.3)' },
  filterBtnActive: { backgroundColor: '#c9a876' },
  filterBtnText: { fontSize: 12, color: '#2a2a2a', fontWeight: '500' },
  filterBtnTextActive: { color: '#fff' },
  tasksList: { flex: 1, paddingHorizontal: 15, paddingTop: 15 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
  emptyText: { fontSize: 16, color: '#666', fontStyle: 'italic' },
  emptySubtext: { fontSize: 12, color: '#999', marginTop: 5 },
  taskCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 3 },
  taskCardCompleted: { backgroundColor: '#f0f0f0' },
  taskContent: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  taskCheckbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#c9a876', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  checkmark: { fontSize: 16, color: '#c9a876', fontWeight: 'bold' },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: '600', color: '#2a2a2a', marginBottom: 6 },
  taskTitleCompleted: { color: '#999', textDecorationLine: 'line-through' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  responsibleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  responsibleBadgeText: { fontSize: 11, fontWeight: '600' },
  dateText: { fontSize: 11, color: '#999' },
  taskActions: { flexDirection: 'row', alignItems: 'center' },
  trackBtn: { padding: 8 },
  trackIcon: { fontSize: 16 },
  deleteBtn: { padding: 8 },
  deleteIcon: { fontSize: 18 },
  trackingTitle: { fontSize: 17, fontWeight: '700', color: '#2a2a2a', marginBottom: 4 },
  trackingSubtitle: { fontSize: 13, color: '#666', marginBottom: 16 },
  occurrenceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  occurrenceIcon: { fontSize: 16, marginRight: 10 },
  occurrenceLabel: { fontSize: 13, fontWeight: '600', color: '#2a2a2a', width: 80 },
  occurrenceStatus: { fontSize: 12, color: '#666', flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%', paddingBottom: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalTitle: { fontSize: 20, fontWeight: '600', color: '#2a2a2a' },
  closeModal: { fontSize: 24, color: '#999' },
  modalBody: { paddingHorizontal: 20, paddingTop: 15 },
  formGroup: { marginBottom: 20 },
  formLabel: { fontSize: 14, fontWeight: '600', color: '#2a2a2a', marginBottom: 8 },
  formInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#2a2a2a' },
  frequencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f0f0f0' },
  categoryOptionActive: { backgroundColor: '#c9a876' },
  categoryOptionText: { fontSize: 13, fontWeight: '500', color: '#2a2a2a' },
  categoryOptionTextActive: { color: '#fff' },
  peopleScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  peopleOption: { marginRight: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f0f0f0' },
  peopleOptionText: { fontSize: 13, fontWeight: '500', color: '#2a2a2a' },
  modalActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#2a2a2a' },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#c9a876', alignItems: 'center' },
  confirmBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

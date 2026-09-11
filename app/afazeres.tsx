import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Modal, ActivityIndicator,
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
import { casa } from '@/constants/casaStyles';
import { Casa, HEADER_MENU_SLOT, Radius, Sheet, Spacing, shadow } from '@/constants/design';
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
    <View style={casa.container}>
      <View style={[casa.header, styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={casa.headerTitleFlex}>Afazeres</Text>
        <TouchableOpacity style={casa.addBtn} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <Text style={casa.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar tarefa..."
          placeholderTextColor={Sheet.placeholder}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersContent}>
        <View style={casa.chipRow}>
          <Text style={casa.filterLabel}>Status</Text>
          {(['Todas', 'Pendente', 'Concluído'] as const).map((status) => (
            <TouchableOpacity key={status} style={[casa.chip, filterStatus === status && casa.chipActive]} onPress={() => setFilterStatus(status)} activeOpacity={0.75}>
              <Text style={[casa.chipText, filterStatus === status && casa.chipTextActive]}>{status}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.filterSeparator} />
        <View style={casa.chipRow}>
          <Text style={casa.filterLabel}>Responsável</Text>
          <TouchableOpacity style={[casa.chip, filterResponsible === 'Todos' && casa.chipActive]} onPress={() => setFilterResponsible('Todos')} activeOpacity={0.75}>
            <Text style={[casa.chipText, filterResponsible === 'Todos' && casa.chipTextActive]}>Todos</Text>
          </TouchableOpacity>
          {PERSON_ORDER.map((id) => (
            <TouchableOpacity key={id} style={[casa.chip, filterResponsible === id && casa.chipActive]} onPress={() => setFilterResponsible(id)} activeOpacity={0.75}>
              <Text style={[casa.chipText, filterResponsible === id && casa.chipTextActive]}>{PERSON_PROFILES[id].name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView style={styles.tasksList} contentContainerStyle={styles.tasksListInner} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={casa.emptyState}>
            <ActivityIndicator size="large" color={Casa.accent} />
          </View>
        ) : filteredActivities.length === 0 ? (
          <View style={casa.emptyState}>
            <Text style={styles.emptyIcon}>🗒️</Text>
            <Text style={casa.emptyText}>Nenhuma tarefa encontrada</Text>
            {activities.length > 0 && <Text style={casa.emptySubtext}>Tente ajustar os filtros</Text>}
          </View>
        ) : (
          filteredActivities.map((activity) => {
            const responsible = activity.assignedTo ? PERSON_PROFILES[activity.assignedTo] : null;
            const completedToday = isCompletedOnDate(activity, relevantDateKeyForToday(activity));
            const canTrack = activeProfileId === activity.createdBy && activity.createdBy !== activity.assignedTo;
            return (
              <View key={activity.id} style={[styles.taskCard, completedToday && styles.taskCardCompleted]}>
                <TouchableOpacity style={styles.taskContent} onPress={() => handleToggle(activity)} activeOpacity={0.7}>
                  <View
                    style={[
                      styles.taskCheckbox,
                      responsible && { borderColor: responsible.colors.primary },
                      completedToday && responsible && { backgroundColor: responsible.colors.primary },
                    ]}
                  >
                    {completedToday && (
                      <Text style={[styles.checkmark, responsible ? { color: responsible.colors.secondary } : null]}>✓</Text>
                    )}
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
                    <TouchableOpacity style={styles.taskActionBtn} onPress={() => setTrackingActivity(activity)} activeOpacity={0.6}>
                      <Text style={styles.taskActionIcon}>📊</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.taskActionBtn} onPress={() => handleDelete(activity.id)} activeOpacity={0.6}>
                    <Text style={styles.taskActionIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={trackingActivity !== null} transparent animationType="slide" onRequestClose={() => setTrackingActivity(null)}>
        <View style={casa.modalOverlay}>
          <View style={casa.modalContent}>
            <View style={casa.modalGrabber} />
            <View style={casa.modalHeader}>
              <Text style={casa.modalTitle}>Acompanhamento</Text>
              <TouchableOpacity style={casa.closeModal} onPress={() => setTrackingActivity(null)} activeOpacity={0.6}>
                <Text style={casa.closeModalIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            {trackingActivity && (
              <ScrollView style={casa.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.trackingTitle}>{trackingActivity.title}</Text>
                <Text style={styles.trackingSubtitle}>
                  Responsável: {trackingActivity.assignedTo ? PERSON_PROFILES[trackingActivity.assignedTo].name : '—'}
                </Text>
                <View style={styles.occurrenceList}>
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
                </View>
                <View style={styles.modalBottomSpacer} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={casa.modalOverlay}>
          <View style={casa.modalContent}>
            <View style={casa.modalGrabber} />
            <View style={casa.modalHeader}>
              <Text style={casa.modalTitle}>Nova tarefa</Text>
              <TouchableOpacity style={casa.closeModal} onPress={() => { setModalVisible(false); resetForm(); }} activeOpacity={0.6}>
                <Text style={casa.closeModalIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={casa.modalBody} showsVerticalScrollIndicator={false}>
              <View style={casa.formGroup}>
                <Text style={casa.formLabel}>Título *</Text>
                <TextInput style={casa.formInput} placeholder="O que precisa ser feito?" value={formTitle} onChangeText={setFormTitle} placeholderTextColor={Sheet.placeholder} />
              </View>

              <View style={casa.formGroup}>
                <Text style={casa.formLabel}>Responsável</Text>
                <View style={styles.optionRow}>
                  {PERSON_ORDER.map((id) => (
                    <TouchableOpacity
                      key={id}
                      style={[
                        casa.sheetChip,
                        formAssignedTo === id && { backgroundColor: PERSON_PROFILES[id].colors.primary, borderColor: PERSON_PROFILES[id].colors.primary },
                      ]}
                      onPress={() => setFormAssignedTo(id)}
                      activeOpacity={0.75}
                    >
                      <Text style={[casa.sheetChipText, formAssignedTo === id && { color: PERSON_PROFILES[id].colors.secondary }]}>
                        {PERSON_PROFILES[id].name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={casa.formGroup}>
                <Text style={casa.formLabel}>Frequência</Text>
                <View style={styles.optionRow}>
                  {([
                    ['once', 'Uma vez'],
                    ['daily', 'Diariamente'],
                    ['weekly', 'Semanalmente'],
                  ] as const).map(([value, label]) => (
                    <TouchableOpacity
                      key={value}
                      style={[casa.sheetChip, formFrequency === value && casa.sheetChipActive]}
                      onPress={() => setFormFrequency(value)}
                      activeOpacity={0.75}
                    >
                      <Text style={[casa.sheetChipText, formFrequency === value && casa.sheetChipTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {formFrequency === 'once' && (
                <View style={casa.formGroup}>
                  <Text style={casa.formLabel}>Data</Text>
                  <TextInput style={casa.formInput} placeholder="DD/MM/AAAA" value={formDate} onChangeText={setFormDate} placeholderTextColor={Sheet.placeholder} />
                </View>
              )}

              {formFrequency === 'weekly' && (
                <View style={casa.formGroup}>
                  <Text style={casa.formLabel}>Dias da semana</Text>
                  <View style={styles.weekdayRow}>
                    {WEEKDAY_LABELS.map((label, index) => (
                      <TouchableOpacity
                        key={label}
                        style={[styles.weekdayBtn, formDaysOfWeek.includes(index) && casa.sheetChipActive]}
                        onPress={() => toggleFormDay(index)}
                        activeOpacity={0.75}
                      >
                        <Text style={[casa.sheetChipText, styles.weekdayText, formDaysOfWeek.includes(index) && casa.sheetChipTextActive]}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
            <View style={casa.modalActions}>
              <TouchableOpacity style={casa.cancelBtn} onPress={() => { setModalVisible(false); resetForm(); }} activeOpacity={0.7}>
                <Text style={casa.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={casa.confirmBtn} onPress={handleAddActivity} activeOpacity={0.85}>
                <Text style={casa.confirmBtnText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Reserva a faixa do botão de menu flutuante, em vez da margem
   *  improvisada que o botão "+" carregava antes. */
  header: { paddingRight: HEADER_MENU_SLOT },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    paddingHorizontal: Spacing.md + 2,
    backgroundColor: Casa.surface,
    borderRadius: Radius.pill,
    ...shadow(1),
  },
  searchIcon: { fontSize: 13, lineHeight: 16, marginRight: Spacing.sm, opacity: 0.55 },
  searchInput: { flex: 1, paddingVertical: Spacing.md - 1, fontSize: 14, color: Casa.ink },
  filtersScroll: { flexGrow: 0, marginTop: Spacing.md },
  filtersContent: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, alignItems: 'center' },
  filterSeparator: { width: 1, height: 20, backgroundColor: Casa.lineOnPage, marginHorizontal: Spacing.lg },
  tasksList: { flex: 1 },
  tasksListInner: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.xxxl },
  emptyIcon: { fontSize: 32, lineHeight: 38, marginBottom: Spacing.md, opacity: 0.6 },
  taskCard: {
    backgroundColor: Casa.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md + 2,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm,
    marginBottom: Spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadow(1),
  },
  taskCardCompleted: { backgroundColor: Casa.surfaceSunken },
  taskContent: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  taskCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Casa.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  checkmark: { fontSize: 12, lineHeight: 14, color: Casa.accent, fontWeight: '700' },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: '600', color: Casa.ink, marginBottom: Spacing.sm - 2, lineHeight: 20 },
  taskTitleCompleted: { color: Casa.inkFaint, textDecorationLine: 'line-through' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  responsibleBadge: { paddingHorizontal: Spacing.sm + 2, paddingVertical: 3, borderRadius: Radius.pill },
  responsibleBadgeText: { fontSize: 11, fontWeight: '700' },
  dateText: { fontSize: 11, color: Casa.inkFaint, fontWeight: '500' },
  taskActions: { flexDirection: 'row', alignItems: 'center' },
  taskActionBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  taskActionIcon: { fontSize: 15, lineHeight: 18 },
  trackingTitle: { fontSize: 17, fontWeight: '700', color: Sheet.title, marginBottom: Spacing.xs },
  trackingSubtitle: { fontSize: 13, color: Sheet.muted, marginBottom: Spacing.lg },
  occurrenceList: { borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Sheet.input },
  occurrenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md - 2,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Sheet.line,
    gap: Spacing.sm + 2,
  },
  occurrenceIcon: { fontSize: 14, lineHeight: 18, width: 20, textAlign: 'center' },
  occurrenceLabel: { fontSize: 13, fontWeight: '600', color: Sheet.title, width: 86 },
  occurrenceStatus: { fontSize: 12, color: Sheet.muted, flex: 1 },
  modalBottomSpacer: { height: Spacing.xxl },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  weekdayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  /** Botões de dia com largura fixa: os sete ficam numa grade regular em
   *  vez de larguras diferentes conforme o rótulo. */
  weekdayBtn: {
    width: 46,
    paddingVertical: Spacing.sm + 1,
    borderRadius: Radius.sm,
    backgroundColor: Sheet.input,
    borderWidth: 1,
    borderColor: Sheet.inputLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: { fontSize: 12 },
});

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedActivities, getActivitiesForPerson, relevantDateKeyForToday, isCompletedOnDate } from '@/hooks/useSharedActivities';
import { useReminders } from '@/hooks/useReminders';
import { usePersonalTasks, type PersonalTask } from '@/hooks/usePersonalTasks';
import { OverdueTasksBanner } from '@/components/OverdueTasksBanner';
import { makeProfileStyles } from '@/constants/profileStyles';
import { PROFILE_THEMES } from '@/constants/profileTheme';
import { Sheet } from '@/constants/design';
import { showConfirm } from '@/utils/alert';
import type { Reminder } from '@/types/database';

const theme = PROFILE_THEMES.emanuella;

export default function EmanuellaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeProfileStyles(theme), []);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [formTaskTitle, setFormTaskTitle] = useState('');
  const [formNoteSubject, setFormNoteSubject] = useState('');
  const [formNoteDate, setFormNoteDate] = useState('');
  const [showCompletedNotes, setShowCompletedNotes] = useState(false);
  const { activities, toggleCompletion } = useSharedActivities();
  const myActivities = getActivitiesForPerson(activities, 'emanuella');
  const { tasks, loading: tasksLoading, addTask, renameTask, toggleTask, deleteTask } = usePersonalTasks('emanuella');
  const {
    reminders,
    completed: completedReminders,
    loading: remindersLoading,
    addReminder,
    updateReminder,
    completeReminder,
    uncompleteReminder,
    deleteReminder,
  } = useReminders('emanuella');

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // === TAREFAS PESSOAIS ===
  const handleAddTask = async () => {
    const title = formTaskTitle.trim();
    if (!title) {
      setTaskModalVisible(false);
      return;
    }

    if (editingTaskId) {
      await renameTask(editingTaskId, title);
    } else {
      await addTask(title);
    }

    setTaskModalVisible(false);
    setEditingTaskId(null);
    setFormTaskTitle('');
  };

  const handleDeleteTask = (task: PersonalTask) => {
    showConfirm(
      {
        title: 'Excluir tarefa',
        message: `Excluir "${task.title}"? Isso não tem como desfazer.`,
        confirmText: 'Excluir',
        destructive: true,
      },
      () => { deleteTask(task.id); }
    );
  };

  const openTaskEditModal = (task: PersonalTask) => {
    setEditingTaskId(task.id);
    setFormTaskTitle(task.title);
    setTaskModalVisible(true);
  };

  const openTaskNewModal = () => {
    setEditingTaskId(null);
    setFormTaskTitle('');
    setTaskModalVisible(true);
  };

  // === LEMBRETES ===
  const handleAddNote = async () => {
    if (!formNoteSubject.trim() && !formNoteDate.trim()) {
      setNoteModalVisible(false);
      return;
    }

    if (editingNoteId) {
      await updateReminder(editingNoteId, formNoteSubject, formNoteDate);
    } else {
      await addReminder(formNoteSubject, formNoteDate);
    }

    setNoteModalVisible(false);
    setEditingNoteId(null);
    setFormNoteSubject('');
    setFormNoteDate('');
  };

  const handleDeleteNote = (reminder: Reminder) => {
    showConfirm(
      {
        title: 'Excluir lembrete',
        message: `Excluir "${reminder.subject}"? Isso não tem como desfazer.`,
        confirmText: 'Excluir',
        destructive: true,
      },
      () => { deleteReminder(reminder.id); }
    );
  };

  const openNoteEditModal = (reminder: Reminder) => {
    setEditingNoteId(reminder.id);
    setFormNoteSubject(reminder.subject);
    setFormNoteDate(reminder.date);
    setNoteModalVisible(true);
  };

  const openNoteNewModal = () => {
    setEditingNoteId(null);
    setFormNoteSubject('');
    setFormNoteDate('');
    setNoteModalVisible(true);
  };

  const getMotivationalMessage = () => {
    if (totalTasks === 0) {
      return '✨ Sem tarefas por enquanto, aproveite o momento!';
    }
    if (completionPercentage === 100) {
      return '🎉 Parabéns! Você completou todas as tarefas de hoje!';
    }
    if (completionPercentage >= 75) {
      return '🚀 Você está quase lá, continue assim!';
    }
    if (completionPercentage >= 50) {
      return '💪 Metade do caminho percorrido, vamos lá!';
    }
    return '🌱 Vamos começar a conquista!';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.headerName} numberOfLines={1}>Emanuella</Text>
        <Text style={styles.headerSubtitle}>👋 Olá, Emanuella!</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        <OverdueTasksBanner personId="emanuella" />
        {/* Card Estatísticas */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completedTasks}</Text>
            <Text style={styles.statLabel}>Concluídas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalTasks - completedTasks}</Text>
            <Text style={styles.statLabel}>Pendentes</Text>
          </View>
        </View>

        {/* Barra de Progresso */}
        {totalTasks > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progresso do dia</Text>
              <Text style={styles.progressText}>
                {Math.round(completionPercentage)}% completo
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${completionPercentage}%` },
                ]}
              />
            </View>
          </View>
        )}

        {/* Mensagem Motivacional */}
        <View style={styles.motivationalCard}>
          <Text style={styles.motivationalText}>{getMotivationalMessage()}</Text>
        </View>

        {/* Seção Tarefas Pessoais */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Minhas tarefas</Text>
            <TouchableOpacity
              style={styles.addSmallBtn}
              onPress={openTaskNewModal}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Adicionar tarefa"
            >
              <Text style={styles.addSmallIcon}>+</Text>
            </TouchableOpacity>
          </View>

          {tasksLoading ? (
            <View style={styles.emptyCard}>
              <ActivityIndicator color={theme.onCardAccent} />
            </View>
          ) : tasks.length === 0 && myActivities.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Nenhuma tarefa ainda.{'\n'}Toque no + para adicionar a primeira.</Text>
            </View>
          ) : (
            <>
              {myActivities.map(activity => {
                const dateKey = relevantDateKeyForToday(activity);
                const done = isCompletedOnDate(activity, dateKey);
                return (
                  <TouchableOpacity
                    key={activity.id}
                    style={[styles.taskItem, done && styles.taskItemCompleted]}
                    onPress={() => toggleCompletion(activity, dateKey, 'emanuella', 'Emanuella')}
                    activeOpacity={0.7}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: done }}
                    accessibilityLabel={activity.title}
                  >
                    <View style={[styles.taskCheckbox, done && styles.taskCheckboxDone]}>
                      {done && <Text style={styles.taskCheckmark}>✓</Text>}
                    </View>
                    <View style={styles.taskBody}>
                      <Text style={[styles.taskText, done && styles.taskTextCompleted]}>
                        {activity.title}
                      </Text>
                      <Text style={styles.orgTaskBadge}>🏠 ATIVIDADE DA CASA</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {tasks.map(task => (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.taskItem, task.completed && styles.taskItemCompleted]}
                  onPress={() => toggleTask(task)}
                  activeOpacity={0.7}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: task.completed }}
                  accessibilityLabel={task.title}
                >
                  <View style={[styles.taskCheckbox, task.completed && styles.taskCheckboxDone]}>
                    {task.completed && <Text style={styles.taskCheckmark}>✓</Text>}
                  </View>
                  <View style={styles.taskBody}>
                    <Text
                      style={[
                        styles.taskText,
                        task.completed && styles.taskTextCompleted,
                      ]}
                    >
                      {task.title}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => openTaskEditModal(task)}
                    style={styles.taskActionBtn}
                    activeOpacity={0.6}
                    accessibilityRole="button"
                    accessibilityLabel={`Editar ${task.title}`}
                  >
                    <Text style={styles.taskActionIcon}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteTask(task)}
                    style={styles.taskActionBtn}
                    activeOpacity={0.6}
                    accessibilityRole="button"
                    accessibilityLabel={`Excluir ${task.title}`}
                  >
                    <Text style={styles.taskActionIcon}>🗑️</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        {/* Seção Lembretes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lembretes</Text>
            <TouchableOpacity
              style={styles.addSmallBtn}
              onPress={openNoteNewModal}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Adicionar lembrete"
            >
              <Text style={styles.addSmallIcon}>+</Text>
            </TouchableOpacity>
          </View>

          {remindersLoading ? (
            <View style={styles.emptyCard}>
              <ActivityIndicator color={theme.onCardAccent} />
            </View>
          ) : reminders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Nenhum lembrete em aberto.{'\n'}Toque no + para adicionar.</Text>
            </View>
          ) : (
            <View style={styles.notesTable}>
              <View style={styles.tableHeader}>
                <View style={styles.colCheck} />
                <Text style={[styles.tableHeaderText, styles.colSubject]}>Assunto</Text>
                <Text style={[styles.tableHeaderText, styles.colDate]}>Data</Text>
                <View style={styles.colActions} />
              </View>
              {reminders.map(reminder => (
                <TouchableOpacity
                  key={reminder.id}
                  style={styles.tableRow}
                  onPress={() => openNoteEditModal(reminder)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Editar lembrete ${reminder.subject}`}
                >
                  <TouchableOpacity
                    onPress={() => completeReminder(reminder.id)}
                    style={styles.reminderCheckbox}
                    activeOpacity={0.6}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: false }}
                    accessibilityLabel={`Concluir ${reminder.subject}`}
                  />
                  <Text style={[styles.cellText, styles.colSubject]} numberOfLines={2}>
                    {reminder.subject}
                  </Text>
                  <Text style={[styles.cellDate, styles.colDate]}>
                    {reminder.date}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteNote(reminder)}
                    style={styles.deleteNoteBtn}
                    activeOpacity={0.6}
                    accessibilityRole="button"
                    accessibilityLabel={`Excluir ${reminder.subject}`}
                  >
                    <Text style={styles.deleteNoteIcon}>🗑️</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Concluídos — ficam acessíveis para reabrir. Marcar um lembrete
              como feito costumava fazê-lo sumir sem deixar rastro. */}
          {completedReminders.length > 0 && (
            <>
              <TouchableOpacity
                style={styles.completedToggle}
                onPress={() => setShowCompletedNotes(v => !v)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={showCompletedNotes ? 'Esconder concluídos' : 'Mostrar concluídos'}
              >
                <Text style={styles.completedToggleText}>
                  {showCompletedNotes ? '▾' : '▸'}  Concluídos ({completedReminders.length})
                </Text>
              </TouchableOpacity>

              {showCompletedNotes && (
                <View style={styles.notesTable}>
                  {completedReminders.map(reminder => (
                    <View key={reminder.id} style={styles.tableRow}>
                      <TouchableOpacity
                        onPress={() => uncompleteReminder(reminder.id)}
                        style={[styles.reminderCheckbox, styles.reminderCheckboxDone]}
                        activeOpacity={0.6}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: true }}
                        accessibilityLabel={`Reabrir ${reminder.subject}`}
                      >
                        <Text style={styles.reminderCheckIcon}>✓</Text>
                      </TouchableOpacity>
                      <Text style={[styles.cellText, styles.colSubject, styles.cellTextDone]} numberOfLines={2}>
                        {reminder.subject}
                      </Text>
                      <Text style={[styles.cellDate, styles.colDate]}>
                        {reminder.date}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteNote(reminder)}
                        style={styles.deleteNoteBtn}
                        activeOpacity={0.6}
                        accessibilityRole="button"
                        accessibilityLabel={`Excluir ${reminder.subject}`}
                      >
                        <Text style={styles.deleteNoteIcon}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* Links para Outras Abas */}
        <View style={styles.quickLinksSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Acesso rápido</Text>
          </View>
          <View style={styles.linksContainer}>
            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => router.push('/afazeres')}
              activeOpacity={0.75}
              accessibilityRole="link"
            >
              <Text style={styles.quickLinkText}>Afazeres da Casa</Text>
              <Text style={styles.quickLinkChevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => router.push('/listas')}
              activeOpacity={0.75}
              accessibilityRole="link"
            >
              <Text style={styles.quickLinkText}>Listas</Text>
              <Text style={styles.quickLinkChevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => router.push('/calendario/calendarioE')}
              activeOpacity={0.75}
              accessibilityRole="link"
            >
              <Text style={styles.quickLinkText}>Meu Calendário</Text>
              <Text style={styles.quickLinkChevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ilustração do rodapé */}
        <View style={styles.footerContainer}>
          <Image
            source={require('@/assets/images/mariecat.png')}
            style={styles.footerImage}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel="Ilustração do perfil"
          />
        </View>
      </ScrollView>

      {/* Modal Tarefa */}
      <Modal
        visible={taskModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTaskModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalGrabber} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTaskId ? 'Editar tarefa' : 'Nova tarefa'}
              </Text>
              <TouchableOpacity style={styles.closeModal} onPress={() => setTaskModalVisible(false)} activeOpacity={0.6} accessibilityRole="button" accessibilityLabel="Fechar">
                <Text style={styles.closeModalIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Descrição da tarefa</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: estudar, ler, exercitar..."
                  value={formTaskTitle}
                  onChangeText={setFormTaskTitle}
                  placeholderTextColor={Sheet.placeholder}
                  accessibilityLabel="Descrição da tarefa"
                />
                {!formTaskTitle.trim() && (
                  <Text style={styles.fieldHint}>Escreva algo para poder salvar.</Text>
                )}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setTaskModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, !formTaskTitle.trim() && styles.confirmBtnDisabled]}
                onPress={handleAddTask}
                disabled={!formTaskTitle.trim()}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmBtnText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Lembrete */}
      <Modal
        visible={noteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalGrabber} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingNoteId ? 'Editar lembrete' : 'Novo lembrete'}
              </Text>
              <TouchableOpacity style={styles.closeModal} onPress={() => setNoteModalVisible(false)} activeOpacity={0.6} accessibilityRole="button" accessibilityLabel="Fechar">
                <Text style={styles.closeModalIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Assunto</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: médico, prova, pagamento..."
                  value={formNoteSubject}
                  onChangeText={setFormNoteSubject}
                  placeholderTextColor={Sheet.placeholder}
                  accessibilityLabel="Assunto do lembrete"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Data</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 05/02/2026"
                  value={formNoteDate}
                  onChangeText={setFormNoteDate}
                  placeholderTextColor={Sheet.placeholder}
                  accessibilityLabel="Data do lembrete"
                />
              </View>

              {!formNoteSubject.trim() && !formNoteDate.trim() && (
                <Text style={styles.fieldHint}>Preencha ao menos o assunto ou a data.</Text>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setNoteModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  !formNoteSubject.trim() && !formNoteDate.trim() && styles.confirmBtnDisabled,
                ]}
                onPress={handleAddNote}
                disabled={!formNoteSubject.trim() && !formNoteDate.trim()}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmBtnText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

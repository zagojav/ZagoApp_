import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedActivities, getActivitiesForPerson, relevantDateKeyForToday, isCompletedOnDate } from '@/hooks/useSharedActivities';
import { useReminders } from '@/hooks/useReminders';
import { OverdueTasksBanner } from '@/components/OverdueTasksBanner';
import type { Reminder } from '@/types/database';


interface PersonalTask {
  id: string;
  title: string;
  completed: boolean;
}


export default function GuilhermeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [formTaskTitle, setFormTaskTitle] = useState('');
  const [formNoteSubject, setFormNoteSubject] = useState('');
  const [formNoteDate, setFormNoteDate] = useState('');
  const { activities, toggleCompletion } = useSharedActivities();
  const myActivities = getActivitiesForPerson(activities, 'guilherme');
  const { reminders, addReminder, updateReminder, completeReminder, deleteReminder } = useReminders('guilherme');


  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;


  // === TAREFAS PESSOAIS ===
  const handleAddTask = () => {
    if (!formTaskTitle.trim()) {
      setTaskModalVisible(false);
      return;
    }


    setTasks(prev => {
      if (editingTaskId) {
        return prev.map(t =>
          t.id === editingTaskId ? { ...t, title: formTaskTitle } : t
        );
      }
      return [
        ...prev,
        {
          id: Date.now().toString(),
          title: formTaskTitle,
          completed: false,
        },
      ];
    });


    setTaskModalVisible(false);
    setEditingTaskId(null);
    setFormTaskTitle('');
  };


  const handleToggleTask = (id: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };


  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
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


  // === NOTAS PESSOAIS ===
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


  const handleDeleteNote = (id: string) => {
    deleteReminder(id);
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
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <View style={styles.headerCenter}>
          <Text style={styles.headerName}>Guilherme</Text>
          <Text style={styles.headerSubtitle}>👋 Olá, Guilherme!</Text>
        </View>
      </View>


      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <OverdueTasksBanner personId="guilherme" />
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
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${completionPercentage}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(completionPercentage)}% completo
            </Text>
          </View>
        )}


        {/* Mensagem Motivacional */}
        <View style={styles.motivationalCard}>
          <Text style={styles.motivationalText}>{getMotivationalMessage()}</Text>
        </View>


        {/* Seção Tarefas Pessoais */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📋 Minhas Tarefas</Text>
            <TouchableOpacity
              style={styles.addSmallBtn}
              onPress={openTaskNewModal}
            >
              <Text style={styles.addSmallIcon}>+</Text>
            </TouchableOpacity>
          </View>


          {tasks.length === 0 && myActivities.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma tarefa adicionada</Text>
          ) : (
            <>
              {myActivities.map(activity => {
                const dateKey = relevantDateKeyForToday(activity);
                const completed = isCompletedOnDate(activity, dateKey);
                return (
                  <TouchableOpacity
                    key={activity.id}
                    style={[styles.taskItem, completed && styles.taskItemCompleted]}
                    onPress={() => toggleCompletion(activity, dateKey, 'guilherme', 'Guilherme')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.taskCheckbox}>
                      {completed && <Text style={styles.taskCheckmark}>✓</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.taskText, completed && styles.taskTextCompleted]}>
                        {activity.title}
                      </Text>
                      <Text style={styles.orgTaskBadge}>🏠 Atividade da casa</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {tasks.map(task => (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.taskItem, task.completed && styles.taskItemCompleted]}
                  onPress={() => handleToggleTask(task.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.taskCheckbox}>
                    {task.completed && <Text style={styles.taskCheckmark}>✓</Text>}
                  </View>
                  <Text
                    style={[
                      styles.taskText,
                      task.completed && styles.taskTextCompleted,
                    ]}
                  >
                    {task.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => openTaskEditModal(task)}
                    style={styles.taskEditBtn}
                  >
                    <Text style={styles.taskEditIcon}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteTask(task.id)}
                  >
                    <Text style={styles.taskDeleteIcon}>🗑️</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>


        {/* Seção Lembretes / Notas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📝 Lembretes</Text>
            <TouchableOpacity
              style={styles.addSmallBtn}
              onPress={openNoteNewModal}
            >
              <Text style={styles.addSmallIcon}>+</Text>
            </TouchableOpacity>
          </View>


          {reminders.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum lembrete adicionado</Text>
          ) : (
            <View style={styles.notesTable}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { width: 30 }]} />
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Assunto</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Data</Text>
                <Text style={[styles.tableHeaderText, { width: 60 }]} />
              </View>
              {reminders.map(reminder => (
                <TouchableOpacity
                  key={reminder.id}
                  style={styles.tableRow}
                  onPress={() => openNoteEditModal(reminder)}
                  activeOpacity={0.7}
                >
                  <TouchableOpacity
                    onPress={() => completeReminder(reminder.id)}
                    style={styles.reminderCheckbox}
                  >
                    <Text style={styles.reminderCheckIcon}>✓</Text>
                  </TouchableOpacity>
                  <Text style={[styles.cellText, { flex: 2 }]}>
                    {reminder.subject}
                  </Text>
                  <Text style={[styles.cellText, { flex: 1 }]}>
                    {reminder.date}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteNote(reminder.id)}
                    style={styles.deleteNoteBtn}
                  >
                    <Text style={styles.deleteNoteIcon}>🗑️</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>


        {/* Links para Outras Abas */}
        <View style={styles.quickLinksSection}>
          <Text style={styles.sectionTitle}>🔗 Acesso Rápido</Text>
          <View style={styles.linksContainer}>
            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => router.push('/afazeres')}
            >
              <Text style={styles.quickLinkText}>Afazeres da Casa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => router.push('/listas')}
            >
              <Text style={styles.quickLinkText}>Listas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => router.push('/calendario/calendarioG')}
            >
              <Text style={styles.quickLinkText}>Meu Calendário</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Foto Pensa Footer */}
        <View style={styles.footerContainer}>
          <Image
            source={require('@/assets/images/pensa.png')}
            style={styles.pensaImage}
            resizeMode="contain"
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTaskId ? 'Editar Tarefa' : 'Nova Tarefa'}
              </Text>
              <TouchableOpacity onPress={() => setTaskModalVisible(false)}>
                <Text style={styles.closeModal}>✕</Text>
              </TouchableOpacity>
            </View>


            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Descrição da Tarefa</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Estudar, ler, exercitar..."
                  value={formTaskTitle}
                  onChangeText={setFormTaskTitle}
                  placeholderTextColor="#ccc"
                />
              </View>
            </View>


            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setTaskModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleAddTask}
              >
                <Text style={styles.confirmBtnText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* Modal Nota */}
      <Modal
        visible={noteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingNoteId ? 'Editar Lembrete' : 'Novo Lembrete'}
              </Text>
              <TouchableOpacity onPress={() => setNoteModalVisible(false)}>
                <Text style={styles.closeModal}>✕</Text>
              </TouchableOpacity>
            </View>


            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Assunto</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Médico, Prova, Pagamento..."
                  value={formNoteSubject}
                  onChangeText={setFormNoteSubject}
                  placeholderTextColor="#ccc"
                />
              </View>


              <View style={styles.formGroup}>
                <Text style={styles.label}>Data</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 05/02/2026"
                  value={formNoteDate}
                  onChangeText={setFormNoteDate}
                  placeholderTextColor="#ccc"
                />
              </View>
            </View>


            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setNoteModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleAddNote}
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


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // branco puro para destaque da imagem branca
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#000000', // preto forte
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#FF0000',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  statsCard: {
    backgroundColor: '#FF0000',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(220, 20, 60, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF0000',
  },
  progressText: {
    fontSize: 12,
    color: '#FF0000',
    fontWeight: '600',
  },
  motivationalCard: {
    backgroundColor: '#F5F5F5', // cinza bem claro
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF0000',
  },
  motivationalText: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  addSmallBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSmallIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 13,
    color: '#666666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  taskItemCompleted: {
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
  taskCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  taskCheckmark: {
    fontSize: 12,
    color: '#FF0000',
    fontWeight: 'bold',
  },
  taskText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  taskTextCompleted: {
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  orgTaskBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF0000',
    marginTop: 2,
  },
  taskEditBtn: {
    marginRight: 8,
  },
  taskEditIcon: {
    fontSize: 16,
  },
  taskDeleteIcon: {
    fontSize: 16,
  },
  notesTable: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#EEEEEE',
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  cellText: {
    fontSize: 12,
    color: '#000000',
  },
  deleteNoteBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteNoteIcon: {
    fontSize: 14,
  },
  reminderCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderCheckIcon: {
    fontSize: 10,
    color: '#FF0000',
    fontWeight: 'bold',
  },
  quickLinksSection: {
    marginBottom: 30,
  },
  linksContainer: {
    gap: 10,
    marginTop: 12,
  },
  quickLink: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#FF0000',
  },
  quickLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  footerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
    backgroundColor: '#FFFFFF',
  },
  pensaImage: {
    width: '100%',
    height: 270,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2a2a2a',
  },
  closeModal: {
    fontSize: 24,
    color: '#999',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2a2a2a',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#2a2a2a',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2a2a2a',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#FF0000',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

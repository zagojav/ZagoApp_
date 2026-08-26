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
import { OverdueTasksBanner } from '@/components/OverdueTasksBanner';

interface PersonalTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Note {
  id: string;
  subject: string;
  date: string;
}

export default function EmanuellaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [formTaskTitle, setFormTaskTitle] = useState('');
  const [formNoteSubject, setFormNoteSubject] = useState('');
  const [formNoteDate, setFormNoteDate] = useState('');
  const { activities, toggleCompletion } = useSharedActivities();
  const myActivities = getActivitiesForPerson(activities, 'emanuella');

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
  const handleAddNote = () => {
    if (!formNoteSubject.trim() && !formNoteDate.trim()) {
      setNoteModalVisible(false);
      return;
    }

    setNotes(prev => {
      if (editingNoteId) {
        return prev.map(n =>
          n.id === editingNoteId
            ? { ...n, subject: formNoteSubject, date: formNoteDate }
            : n
        );
      }
      return [
        ...prev,
        {
          id: Date.now().toString(),
          subject: formNoteSubject,
          date: formNoteDate,
        },
      ];
    });

    setNoteModalVisible(false);
    setEditingNoteId(null);
    setFormNoteSubject('');
    setFormNoteDate('');
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const openNoteEditModal = (note: Note) => {
    setEditingNoteId(note.id);
    setFormNoteSubject(note.subject);
    setFormNoteDate(note.date);
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
          <Text style={styles.headerName}>Emanuella</Text>
          <Text style={styles.headerSubtitle}>👋 Olá, Emanuella!</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                    onPress={() => toggleCompletion(activity, dateKey, 'emanuella', 'Emanuella')}
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

          {notes.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum lembrete adicionado</Text>
          ) : (
            <View style={styles.notesTable}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Assunto</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Data</Text>
                <Text style={[styles.tableHeaderText, { width: 60 }]} />
              </View>
              {notes.map(note => (
                <TouchableOpacity
                  key={note.id}
                  style={styles.tableRow}
                  onPress={() => openNoteEditModal(note)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cellText, { flex: 2 }]}>
                    {note.subject}
                  </Text>
                  <Text style={[styles.cellText, { flex: 1 }]}>
                    {note.date}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteNote(note.id)}
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
              onPress={() => router.push('/calendario/calendarioE')}
            >
              <Text style={styles.quickLinkText}>Meu Calendário</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Foto Mariecat Footer */}
        <View style={styles.footerContainer}>
          <Image
            source={require('@/assets/images/mariecat.png')}
            style={styles.mariecatImage}
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#E83E8C', // rosa forte
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
    color: '#FCE4EC',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  statsCard: {
    backgroundColor: '#E83E8C',
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
    backgroundColor: 'rgba(233, 30, 99, 0.15)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E83E8C',
  },
  progressText: {
    fontSize: 12,
    color: '#E83E8C',
    fontWeight: '600',
  },
  motivationalCard: {
    backgroundColor: '#FCE4EC', // rosa pastel
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#E83E8C',
  },
  motivationalText: {
    fontSize: 13,
    color: '#C71A6C',
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
    color: '#E83E8C',
  },
  addSmallBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E83E8C',
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
    backgroundColor: '#FCE4EC',
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
    borderColor: '#E83E8C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  taskCheckmark: {
    fontSize: 12,
    color: '#E83E8C',
    fontWeight: 'bold',
  },
  taskText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  orgTaskBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#C71A6C',
    marginTop: 2,
  },
  taskTextCompleted: {
    color: '#999999',
    textDecorationLine: 'line-through',
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
    backgroundColor: '#FCE4EC',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(233, 30, 99, 0.1)',
    backgroundColor: '#F8BBD0',
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C71A6C',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(233, 30, 99, 0.05)',
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
  quickLinksSection: {
    marginBottom: 30,
  },
  linksContainer: {
    gap: 10,
    marginTop: 12,
  },
  quickLink: {
    backgroundColor: '#FCE4EC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#E83E8C',
  },
  quickLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C71A6C',
  },
  footerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
    backgroundColor: '#FFFFFF',
  },
  mariecatImage: {
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
    backgroundColor: '#E83E8C',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

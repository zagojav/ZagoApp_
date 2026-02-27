import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Modal, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { salvar, carregar } from '../utils/storage';

interface Task {
  id: string;
  title: string;
  category: string;
  responsible: string;
  dueDate: string;
  completed: boolean;
}

const CATEGORIES = ['Limpeza', 'Compras', 'Cozinha', 'Reparos', 'Outro'];
const PEOPLE = ['Amanda', 'Guilherme', 'Renata', 'Vander'];

export default function AfazeresScreen() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterResponsible, setFilterResponsible] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Todas');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formResponsible, setFormResponsible] = useState(PEOPLE[0]);
  const [formDate, setFormDate] = useState('');

  // Carregar tarefas ao abrir
  useEffect(() => {
    carregar<Task[]>('tarefas').then(dados => {
      if (dados) setTasks(dados);
    });
  }, []);

  // Salvar sempre que mudar
  useEffect(() => {
    salvar('tarefas', tasks);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchText.toLowerCase());
      const matchesCategory = filterCategory === 'Todas' || task.category === filterCategory;
      const matchesResponsible = filterResponsible === 'Todos' || task.responsible === filterResponsible;
      const matchesStatus = filterStatus === 'Todas' || (filterStatus === 'Concluído' && task.completed) || (filterStatus === 'Pendente' && !task.completed);
      return matchesSearch && matchesCategory && matchesResponsible && matchesStatus;
    });
  }, [tasks, searchText, filterCategory, filterResponsible, filterStatus]);

  const handleAddTask = () => {
    if (!formTitle.trim()) { Alert.alert('Erro', 'Por favor, preencha o título da tarefa'); return; }
    const newTask: Task = { id: Date.now().toString(), title: formTitle, category: formCategory, responsible: formResponsible, dueDate: formDate, completed: false };
    setTasks([...tasks, newTask]);
    resetForm();
    setModalVisible(false);
  };

  const handleToggleTask = (id: string) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  };

  const handleDeleteTask = (id: string) => { setTasks(prev => prev.filter(task => task.id !== id)); };

  const resetForm = () => { setFormTitle(''); setFormCategory(CATEGORIES[0]); setFormResponsible(PEOPLE[0]); setFormDate(''); };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = { Limpeza: '#c8e6c9', Compras: '#bbdefb', Cozinha: '#ffe0b2', Reparos: '#f8bbd0', Outro: '#e1bee7' };
    return colors[category] || '#e8dcc8';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
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
          {['Todas', 'Pendente', 'Concluído'].map(status => (
            <TouchableOpacity key={status} style={[styles.filterBtn, filterStatus === status && styles.filterBtnActive]} onPress={() => setFilterStatus(status)}>
              <Text style={[styles.filterBtnText, filterStatus === status && styles.filterBtnTextActive]}>{status}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Categoria:</Text>
          {['Todas', ...CATEGORIES].map(cat => (
            <TouchableOpacity key={cat} style={[styles.filterBtn, filterCategory === cat && styles.filterBtnActive]} onPress={() => setFilterCategory(cat)}>
              <Text style={[styles.filterBtnText, filterCategory === cat && styles.filterBtnTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Responsável:</Text>
          {['Todos', ...PEOPLE].map(person => (
            <TouchableOpacity key={person} style={[styles.filterBtn, filterResponsible === person && styles.filterBtnActive]} onPress={() => setFilterResponsible(person)}>
              <Text style={[styles.filterBtnText, filterResponsible === person && styles.filterBtnTextActive]}>{person}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView style={styles.tasksList}>
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhuma tarefa encontrada</Text>
            {tasks.length > 0 && <Text style={styles.emptySubtext}>Tente ajustar os filtros</Text>}
          </View>
        ) : (
          filteredTasks.map(task => (
            <View key={task.id} style={[styles.taskCard, task.completed && styles.taskCardCompleted]}>
              <TouchableOpacity style={styles.taskContent} onPress={() => handleToggleTask(task.id)}>
                <View style={styles.taskCheckbox}>{task.completed && <Text style={styles.checkmark}>✓</Text>}</View>
                <View style={styles.taskInfo}>
                  <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>{task.title}</Text>
                  <View style={styles.taskMeta}>
                    <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(task.category) }]}>
                      <Text style={styles.categoryText}>{task.category}</Text>
                    </View>
                    <Text style={styles.responsibleText}>👤 {task.responsible}</Text>
                    {task.dueDate && <Text style={styles.dateText}>📅 {task.dueDate}</Text>}
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteTask(task.id)}>
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

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
                <Text style={styles.formLabel}>Categoria</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity key={cat} style={[styles.categoryOption, formCategory === cat && styles.categoryOptionActive]} onPress={() => setFormCategory(cat)}>
                      <Text style={[styles.categoryOptionText, formCategory === cat && styles.categoryOptionTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Responsável</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.peopleScroll}>
                  {PEOPLE.map(person => (
                    <TouchableOpacity key={person} style={[styles.peopleOption, formResponsible === person && styles.peopleOptionActive]} onPress={() => setFormResponsible(person)}>
                      <Text style={[styles.peopleOptionText, formResponsible === person && styles.peopleOptionTextActive]}>{person}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Data (opcional)</Text>
                <TextInput style={styles.formInput} placeholder="DD/MM/YYYY" value={formDate} onChangeText={setFormDate} placeholderTextColor="#ccc" />
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); resetForm(); }}><Text style={styles.cancelBtnText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddTask}><Text style={styles.confirmBtnText}>Adicionar</Text></TouchableOpacity>
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
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); router.push('/pets'); }}><Text style={styles.menuText}>Pets</Text></TouchableOpacity>
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
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#c9a876', justifyContent: 'center', alignItems: 'center' },
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
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  categoryText: { fontSize: 11, fontWeight: '600', color: '#2a2a2a' },
  responsibleText: { fontSize: 11, color: '#666' },
  dateText: { fontSize: 11, color: '#999' },
  deleteBtn: { padding: 8 },
  deleteIcon: { fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%', paddingBottom: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalTitle: { fontSize: 20, fontWeight: '600', color: '#2a2a2a' },
  closeModal: { fontSize: 24, color: '#999' },
  modalBody: { paddingHorizontal: 20, paddingTop: 15 },
  formGroup: { marginBottom: 20 },
  formLabel: { fontSize: 14, fontWeight: '600', color: '#2a2a2a', marginBottom: 8 },
  formInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#2a2a2a' },
  categoryScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  categoryOption: { marginRight: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f0f0f0' },
  categoryOptionActive: { backgroundColor: '#c9a876' },
  categoryOptionText: { fontSize: 13, fontWeight: '500', color: '#2a2a2a' },
  categoryOptionTextActive: { color: '#fff' },
  peopleScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  peopleOption: { marginRight: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f0f0f0' },
  peopleOptionActive: { backgroundColor: '#c9a876' },
  peopleOptionText: { fontSize: 13, fontWeight: '500', color: '#2a2a2a' },
  peopleOptionTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#2a2a2a' },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#c9a876', alignItems: 'center' },
  confirmBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  sideMenu: { position: 'absolute', top: 0, left: 0, width: '65%', height: '100%', backgroundColor: '#6f5947', paddingTop: 20 },
  closeBtn: { paddingHorizontal: 20, paddingVertical: 10 },
  closeIcon: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
  menuItem: { paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.2)' },
  menuText: { fontSize: 16, color: '#fff', fontWeight: '500' },
});

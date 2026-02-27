import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, TextInput, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { salvar, carregar } from '../../utils/storage';

interface Event {
  id: string;
  date: string;
  title: string;
  description: string;
  time: string;
}

export default function CalendarioRenataScreen() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 7));
  const [events, setEvents] = useState<Event[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [yearPickerVisible, setYearPickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTime, setFormTime] = useState('');

  // Carregar eventos ao abrir
  useEffect(() => {
    carregar<Event[]>('calendario_renata').then(dados => {
      if (dados) setEvents(dados);
    });
  }, []);

  // Salvar sempre que mudar
  useEffect(() => {
    salvar('calendario_renata', events);
  }, [events]);

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const formatDate = (day: number, month: number, year: number) => `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
  const handlePreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  const handleSelectMonth = (monthIndex: number) => { setCurrentDate(new Date(currentDate.getFullYear(), monthIndex)); setMonthPickerVisible(false); };
  const handleSelectYear = (year: number) => { setCurrentDate(new Date(year, currentDate.getMonth())); setYearPickerVisible(false); };

  const handleDayPress = (day: number) => {
    const dateStr = formatDate(day, currentDate.getMonth(), currentDate.getFullYear());
    setSelectedDate(dateStr); setEditingEventId(null); setFormTitle(''); setFormDescription(''); setFormTime(''); setModalVisible(true);
  };

  const handleAddEvent = () => {
    if (!formTitle.trim()) { setModalVisible(false); return; }
    setEvents(prev => {
      if (editingEventId) {
        return prev.map(e => e.id === editingEventId ? { ...e, title: formTitle, description: formDescription, time: formTime } : e);
      }
      return [...prev, { id: Date.now().toString(), date: selectedDate, title: formTitle, description: formDescription, time: formTime }];
    });
    setModalVisible(false); setEditingEventId(null); setFormTitle(''); setFormDescription(''); setFormTime('');
  };

  const handleDeleteEvent = (id: string) => { setEvents(prev => prev.filter(e => e.id !== id)); };
  const openEditModal = (event: Event) => { setSelectedDate(event.date); setEditingEventId(event.id); setFormTitle(event.title); setFormDescription(event.description); setFormTime(event.time); setModalVisible(true); };
  const getEventsForDate = (date: string) => events.filter(e => e.date === date);
  const getEventsForMonth = () => events.filter(e => { const [, month, year] = e.date.split('/'); return parseInt(month) === currentDate.getMonth() + 1 && parseInt(year) === currentDate.getFullYear(); }).sort((a, b) => parseInt(a.date.split('/')[0]) - parseInt(b.date.split('/')[0]));

  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const dayNames = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const calendarDays: (number | null)[] = [...Array(firstDay).fill(null), ...Array(daysInMonth).fill(null).map((_, i) => i + 1)];
  const monthEvents = getEventsForMonth();
  const years = Array.from({ length: 20 }, (_, i) => 2016 + i);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendário Renata</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.monthSelector}>
          <TouchableOpacity style={styles.monthArrow} onPress={handlePreviousMonth}><Text style={styles.arrowText}>←</Text></TouchableOpacity>
          <TouchableOpacity style={styles.monthYearContainer} onPress={() => setMonthPickerVisible(true)}><Text style={styles.monthYearText}>{monthNames[currentDate.getMonth()]}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.monthYearContainer} onPress={() => setYearPickerVisible(true)}><Text style={styles.monthYearText}>{currentDate.getFullYear()}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.monthArrow} onPress={handleNextMonth}><Text style={styles.arrowText}>→</Text></TouchableOpacity>
        </View>

        <View style={styles.weekDaysContainer}>
          {dayNames.map(day => (<View key={day} style={styles.weekDayCell}><Text style={styles.weekDayText}>{day}</Text></View>))}
        </View>

        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => {
            const dateStr = day === null ? '' : formatDate(day, currentDate.getMonth(), currentDate.getFullYear());
            const dayEvents = dateStr ? getEventsForDate(dateStr) : [];
            const hasEvents = dayEvents.length > 0;
            const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
            return (
              <TouchableOpacity key={index} style={[styles.calendarDay, day === null && styles.emptyDay, isToday && styles.todayDay, hasEvents && styles.eventDay]} onPress={() => day !== null && handleDayPress(day)} disabled={day === null} activeOpacity={0.7}>
                {day !== null && (
                  <>
                    <Text style={[styles.dayNumber, isToday && styles.dayNumberToday, hasEvents && styles.dayNumberEvent]}>{day}</Text>
                    {hasEvents && (
                      <View style={styles.eventIndicators}>
                        {dayEvents.slice(0, 2).map((_, idx) => (<View key={idx} style={[styles.eventDot, idx === 1 && { marginLeft: 2 }]} />))}
                        {dayEvents.length > 2 && <Text style={styles.moreIndicator}>+</Text>}
                      </View>
                    )}
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.monthEventsSection}>
          <Text style={styles.sectionTitle}>📅 Eventos do Mês</Text>
          {monthEvents.length === 0 ? (
            <Text style={styles.emptyEventsText}>Nenhum evento este mês</Text>
          ) : (
            monthEvents.map(event => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventCardContent}>
                  <View style={styles.eventDateBadge}><Text style={styles.eventDateText}>{event.date.split('/')[0]}</Text></View>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    {event.time && <Text style={styles.eventTime}>🕐 {event.time}</Text>}
                    {event.description && <Text style={styles.eventDescription}>{event.description}</Text>}
                  </View>
                </View>
                <View style={styles.eventActions}>
                  <TouchableOpacity onPress={() => openEditModal(event)} style={styles.eventActionBtn}><Text style={styles.eventActionIcon}>✏️</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteEvent(event.id)} style={styles.eventActionBtn}><Text style={styles.eventActionIcon}>🗑️</Text></TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingEventId ? 'Editar Evento' : 'Novo Evento'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.closeModal}>✕</Text></TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.dateDisplay}>
                <Text style={styles.dateDisplayLabel}>Data:</Text>
                <Text style={styles.dateDisplayValue}>{selectedDate}</Text>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Título do Evento *</Text>
                <TextInput style={styles.input} placeholder="Ex: Reunião, Aniversário..." value={formTitle} onChangeText={setFormTitle} placeholderTextColor="#ccc" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Horário (opcional)</Text>
                <TextInput style={styles.input} placeholder="Ex: 14:00" value={formTime} onChangeText={setFormTime} placeholderTextColor="#ccc" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Descrição (opcional)</Text>
                <TextInput style={[styles.input, styles.textArea]} placeholder="Detalhes..." value={formDescription} onChangeText={setFormDescription} placeholderTextColor="#ccc" multiline numberOfLines={3} />
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelBtnText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddEvent}><Text style={styles.confirmBtnText}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={monthPickerVisible} transparent animationType="fade" onRequestClose={() => setMonthPickerVisible(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Selecione o Mês</Text>
            <FlatList data={monthNames} keyExtractor={(_, i) => i.toString()} numColumns={3} scrollEnabled={false}
              renderItem={({ item, index }) => (
                <TouchableOpacity style={[styles.monthPickerBtn, currentDate.getMonth() === index && styles.monthPickerBtnActive]} onPress={() => handleSelectMonth(index)}>
                  <Text style={[styles.monthPickerText, currentDate.getMonth() === index && styles.monthPickerTextActive]}>{item.substring(0, 3)}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.pickerCloseBtn} onPress={() => setMonthPickerVisible(false)}><Text style={styles.pickerCloseBtnText}>Fechar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={yearPickerVisible} transparent animationType="fade" onRequestClose={() => setYearPickerVisible(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Selecione o Ano</Text>
            <FlatList data={years} keyExtractor={(item) => item.toString()} numColumns={3}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.yearPickerBtn, currentDate.getFullYear() === item && styles.yearPickerBtnActive]} onPress={() => handleSelectYear(item)}>
                  <Text style={[styles.yearPickerText, currentDate.getFullYear() === item && styles.yearPickerTextActive]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.pickerCloseBtn} onPress={() => setYearPickerVisible(false)}><Text style={styles.pickerCloseBtnText}>Fechar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0faf5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#1b5e20' },
  backBtn: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#2e7d32', justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
  headerTitle: { fontSize: 24, fontWeight: '300', fontStyle: 'italic', color: '#fff', letterSpacing: 1 },
  content: { flex: 1, paddingHorizontal: 10, paddingVertical: 15 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, backgroundColor: '#2e7d32', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12 },
  monthArrow: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  arrowText: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
  monthYearContainer: { backgroundColor: '#1b5e20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  monthYearText: { fontSize: 14, fontWeight: '600', color: '#2e7d32' },
  weekDaysContainer: { flexDirection: 'row', marginBottom: 6 },
  weekDayCell: { flex: 1, paddingVertical: 8 },
  weekDayText: { textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#1b5e20' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  calendarDay: { width: '14.28%', aspectRatio: 1, backgroundColor: '#F5F5F5', borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', margin: 1, padding: 4 },
  emptyDay: { backgroundColor: 'transparent', borderWidth: 0 },
  todayDay: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
  eventDay: { backgroundColor: '#FFFFFF', borderColor: '#2e7d32', borderWidth: 2 },
  dayNumber: { fontSize: 12, fontWeight: '600', color: '#1b5e20' },
  dayNumberToday: { color: '#fff' },
  dayNumberEvent: { color: '#1b5e20' },
  eventIndicators: { flexDirection: 'row', marginTop: 2, alignItems: 'center' },
  eventDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#2e7d32' },
  moreIndicator: { fontSize: 8, color: '#2e7d32', fontWeight: 'bold', marginLeft: 2 },
  monthEventsSection: { marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1b5e20', marginBottom: 12 },
  emptyEventsText: { fontSize: 14, color: '#666', fontStyle: 'italic', textAlign: 'center', paddingVertical: 20 },
  eventCard: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderLeftWidth: 3, borderLeftColor: '#2e7d32' },
  eventCardContent: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  eventDateBadge: { backgroundColor: '#2e7d32', width: 40, height: 40, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  eventDateText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: '600', color: '#1b5e20', marginBottom: 4 },
  eventTime: { fontSize: 12, color: '#2e7d32', marginBottom: 2 },
  eventDescription: { fontSize: 11, color: '#666', fontStyle: 'italic' },
  eventActions: { flexDirection: 'row', gap: 8 },
  eventActionBtn: { padding: 6 },
  eventActionIcon: { fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#2a2a2a' },
  closeModal: { fontSize: 24, color: '#999' },
  modalBody: { paddingHorizontal: 20, paddingTop: 15 },
  dateDisplay: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center' },
  dateDisplayLabel: { fontSize: 13, fontWeight: '600', color: '#666', marginRight: 8 },
  dateDisplayValue: { fontSize: 14, fontWeight: '700', color: '#2e7d32' },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#2a2a2a', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#2a2a2a' },
  textArea: { paddingTop: 8, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 15, paddingBottom: 20 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#2a2a2a' },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#2e7d32', alignItems: 'center' },
  confirmBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  pickerContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '85%' },
  pickerTitle: { fontSize: 18, fontWeight: '700', color: '#2a2a2a', marginBottom: 16, textAlign: 'center' },
  monthPickerBtn: { flex: 1, backgroundColor: '#f0f0f0', paddingVertical: 12, marginHorizontal: 6, marginBottom: 8, borderRadius: 8, alignItems: 'center' },
  monthPickerBtnActive: { backgroundColor: '#2e7d32' },
  monthPickerText: { fontSize: 13, fontWeight: '600', color: '#2a2a2a' },
  monthPickerTextActive: { color: '#fff' },
  yearPickerBtn: { flex: 1, backgroundColor: '#f0f0f0', paddingVertical: 12, marginHorizontal: 6, marginBottom: 8, borderRadius: 8, alignItems: 'center' },
  yearPickerBtnActive: { backgroundColor: '#2e7d32' },
  yearPickerText: { fontSize: 13, fontWeight: '600', color: '#2a2a2a' },
  yearPickerTextActive: { color: '#fff' },
  pickerCloseBtn: { backgroundColor: '#2e7d32', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  pickerCloseBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

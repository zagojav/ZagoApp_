import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Modal, TextInput, FlatList, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedActivities, getActivitiesForPerson, isActivityOnDate, isCompletedOnDate } from '@/hooks/useSharedActivities';
import { useCalendarEvents, type CalendarEvent } from '@/hooks/useCalendarEvents';
import { makeCalendarStyles } from '@/constants/calendarStyles';
import { CALENDAR_THEMES } from '@/constants/profileTheme';
import { showConfirm } from '@/utils/alert';

const theme = CALENDAR_THEMES.amanda;

export default function CalendarioAmandaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeCalendarStyles(theme), []);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 7));
  const [modalVisible, setModalVisible] = useState(false);
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [yearPickerVisible, setYearPickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTime, setFormTime] = useState('');
  const { activities, toggleCompletion } = useSharedActivities();
  const myActivities = getActivitiesForPerson(activities, 'amanda');

  // Os eventos vivem no Firestore. Antes ficavam só no AsyncStorage daquele
  // aparelho, e um efeito de salvar disparava com a lista vazia antes de o
  // carregamento terminar — o que apagava tudo de vez em quando.
  const { events, loading, addEvent, updateEvent, deleteEvent } = useCalendarEvents('amanda');

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

  const handleAddEvent = async () => {
    const title = formTitle.trim();
    if (!title) { setModalVisible(false); return; }
    if (editingEventId) {
      await updateEvent(editingEventId, { title, description: formDescription, time: formTime });
    } else {
      await addEvent({ date: selectedDate, title, description: formDescription, time: formTime });
    }
    setModalVisible(false); setEditingEventId(null); setFormTitle(''); setFormDescription(''); setFormTime('');
  };

  const handleDeleteEvent = (event: CalendarEvent) => {
    showConfirm(
      {
        title: 'Excluir evento',
        message: `Excluir "${event.title}" de ${event.date}? Isso não tem como desfazer.`,
        confirmText: 'Excluir',
        destructive: true,
      },
      () => { deleteEvent(event.id); }
    );
  };

  const openEditModal = (event: CalendarEvent) => { setSelectedDate(event.date); setEditingEventId(event.id); setFormTitle(event.title); setFormDescription(event.description); setFormTime(event.time); setModalVisible(true); };
  const getEventsForDate = (date: string) => events.filter(e => e.date === date);
  const parseDateStr = (dateStr: string) => { const [d, m, y] = dateStr.split('/').map(Number); return new Date(y, m - 1, d); };
  const getActivitiesForDate = (dateStr: string) => myActivities.filter(a => isActivityOnDate(a, parseDateStr(dateStr)));
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
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Voltar">
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Calendário Amanda</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        <View style={styles.monthSelector}>
          <TouchableOpacity style={styles.monthArrow} onPress={handlePreviousMonth} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Mês anterior"><Text style={styles.arrowText}>←</Text></TouchableOpacity>
          <View style={styles.monthYearGroup}>
            <TouchableOpacity style={styles.monthYearContainer} onPress={() => setMonthPickerVisible(true)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Escolher mês"><Text style={styles.monthYearText}>{monthNames[currentDate.getMonth()]}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.monthYearContainer} onPress={() => setYearPickerVisible(true)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Escolher ano"><Text style={styles.monthYearText}>{currentDate.getFullYear()}</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.monthArrow} onPress={handleNextMonth} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Próximo mês"><Text style={styles.arrowText}>→</Text></TouchableOpacity>
        </View>

        <View style={styles.weekDaysContainer}>
          {dayNames.map(day => (<View key={day} style={styles.weekDayCell}><Text style={styles.weekDayText}>{day}</Text></View>))}
        </View>

        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => {
            const dateStr = day === null ? '' : formatDate(day, currentDate.getMonth(), currentDate.getFullYear());
            const dayEvents = dateStr ? getEventsForDate(dateStr) : [];
            const dayActivities = dateStr ? getActivitiesForDate(dateStr) : [];
            const hasEvents = dayEvents.length > 0;
            const hasActivities = dayActivities.length > 0;
            const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
            return (
              <TouchableOpacity
                key={index}
                style={styles.dayCell}
                onPress={() => day !== null && handleDayPress(day)}
                disabled={day === null}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={day === null ? undefined : `Dia ${day}${hasEvents ? `, ${dayEvents.length} evento(s)` : ''}`}
              >
                {day !== null && (
                  <View style={[styles.dayBox, isToday && styles.dayBoxToday, hasEvents && !isToday && styles.dayBoxEvent]}>
                    <Text style={[styles.dayNumber, hasEvents && styles.dayNumberEvent, isToday && styles.dayNumberToday]}>{day}</Text>
                    <View style={styles.dayMarkers}>
                      {hasEvents && dayEvents.slice(0, 2).map((_, idx) => (
                        <View key={idx} style={[styles.eventDot, isToday && styles.eventDotToday]} />
                      ))}
                      {dayEvents.length > 2 && <Text style={[styles.moreIndicator, isToday && styles.moreIndicatorToday]}>+</Text>}
                      {hasActivities && <View style={[styles.activityDot, isToday && styles.activityDotToday]} />}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={styles.eventDot} />
            <Text style={styles.legendText}>Evento</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.activityDot} />
            <Text style={styles.legendText}>Atividade da casa</Text>
          </View>
        </View>

        <View style={styles.monthEventsSection}>
          <Text style={styles.sectionTitle}>Eventos do mês</Text>
          {loading ? (
            <View style={styles.emptyEventsCard}>
              <ActivityIndicator color={theme.accent} />
            </View>
          ) : monthEvents.length === 0 ? (
            <View style={styles.emptyEventsCard}>
              <Text style={styles.emptyEventsText}>Nenhum evento este mês.{'\n'}Toque em um dia para criar o primeiro.</Text>
            </View>
          ) : (
            monthEvents.map(event => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventCardContent}>
                  <View style={styles.eventDateBadge}><Text style={styles.eventDateText}>{event.date.split('/')[0]}</Text></View>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    {event.time ? <Text style={styles.eventTime}>{event.time}</Text> : null}
                    {event.description ? <Text style={styles.eventDescription}>{event.description}</Text> : null}
                  </View>
                </View>
                <View style={styles.eventActions}>
                  <TouchableOpacity onPress={() => openEditModal(event)} style={styles.eventActionBtn} activeOpacity={0.6} accessibilityRole="button" accessibilityLabel={`Editar ${event.title}`}><Text style={styles.eventActionIcon}>✏️</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteEvent(event)} style={styles.eventActionBtn} activeOpacity={0.6} accessibilityRole="button" accessibilityLabel={`Excluir ${event.title}`}><Text style={styles.eventActionIcon}>🗑️</Text></TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalGrabber} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingEventId ? 'Editar evento' : 'Novo evento'}</Text>
              <TouchableOpacity style={styles.closeModal} onPress={() => setModalVisible(false)} activeOpacity={0.6} accessibilityRole="button" accessibilityLabel="Fechar"><Text style={styles.closeModalIcon}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.dateDisplay}>
                <Text style={styles.dateDisplayLabel}>Data</Text>
                <Text style={styles.dateDisplayValue}>{selectedDate}</Text>
              </View>
              {getActivitiesForDate(selectedDate).length > 0 && (
                <View style={styles.activitiesSection}>
                  <Text style={styles.activitiesSectionTitle}>ATIVIDADES DA CASA</Text>
                  {getActivitiesForDate(selectedDate).map(activity => {
                    const completed = isCompletedOnDate(activity, selectedDate);
                    return (
                      <TouchableOpacity
                        key={activity.id}
                        style={styles.activityRow}
                        onPress={() => toggleCompletion(activity, selectedDate, 'amanda', 'Amanda')}
                        activeOpacity={0.7}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: completed }}
                        accessibilityLabel={activity.title}
                      >
                        <View style={[styles.activityCheckbox, completed && styles.activityCheckboxDone]}>
                          {completed && <Text style={styles.activityCheckmark}>✓</Text>}
                        </View>
                        <Text style={[styles.activityText, completed && styles.activityTextCompleted]}>{activity.title}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Título do evento *</Text>
                <TextInput style={styles.input} placeholder="Ex: Reunião, aniversário..." value={formTitle} onChangeText={setFormTitle} placeholderTextColor="#A9A099" accessibilityLabel="Título do evento" />
                {!formTitle.trim() && <Text style={styles.fieldHint}>O título é obrigatório para salvar.</Text>}
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Horário (opcional)</Text>
                <TextInput style={styles.input} placeholder="Ex: 14:00" value={formTime} onChangeText={setFormTime} placeholderTextColor="#A9A099" accessibilityLabel="Horário do evento" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Descrição (opcional)</Text>
                <TextInput style={[styles.input, styles.textArea]} placeholder="Detalhes..." value={formDescription} onChangeText={setFormDescription} placeholderTextColor="#A9A099" multiline numberOfLines={3} accessibilityLabel="Descrição do evento" />
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} activeOpacity={0.7}><Text style={styles.cancelBtnText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, !formTitle.trim() && styles.confirmBtnDisabled]} onPress={handleAddEvent} disabled={!formTitle.trim()} activeOpacity={0.85}><Text style={styles.confirmBtnText}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={monthPickerVisible} transparent animationType="fade" onRequestClose={() => setMonthPickerVisible(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Selecione o mês</Text>
            <FlatList data={monthNames} keyExtractor={(_, i) => i.toString()} numColumns={3} scrollEnabled={false} columnWrapperStyle={styles.pickerRow}
              renderItem={({ item, index }) => (
                <TouchableOpacity style={[styles.pickerBtn, currentDate.getMonth() === index && styles.pickerBtnActive]} onPress={() => handleSelectMonth(index)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={item}>
                  <Text style={[styles.pickerBtnText, currentDate.getMonth() === index && styles.pickerBtnTextActive]}>{item.substring(0, 3)}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.pickerCloseBtn} onPress={() => setMonthPickerVisible(false)} activeOpacity={0.7}><Text style={styles.pickerCloseBtnText}>Fechar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={yearPickerVisible} transparent animationType="fade" onRequestClose={() => setYearPickerVisible(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Selecione o ano</Text>
            <FlatList data={years} keyExtractor={(item) => item.toString()} numColumns={3} columnWrapperStyle={styles.pickerRow}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.pickerBtn, currentDate.getFullYear() === item && styles.pickerBtnActive]} onPress={() => handleSelectYear(item)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={String(item)}>
                  <Text style={[styles.pickerBtnText, currentDate.getFullYear() === item && styles.pickerBtnTextActive]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.pickerCloseBtn} onPress={() => setYearPickerVisible(false)} activeOpacity={0.7}><Text style={styles.pickerCloseBtnText}>Fechar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

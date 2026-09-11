import { StyleSheet } from 'react-native';
import { APP_MAX_WIDTH, Radius, shadow, Sheet, Spacing, Type } from '@/constants/design';
import type { CalendarTheme } from '@/constants/profileTheme';

/**
 * Estilos do calendário, gerados a partir da paleta da pessoa.
 *
 * Os seis calendários eram arquivos idênticos com cores coladas à mão —
 * e por isso tinham paletas que não batiam com o perfil. Agora existe uma
 * receita só, e cada tela passa a paleta do próprio dono.
 *
 * A grade é o ponto crítico de alinhamento: cada coluna ocupa exatamente
 * 1/7 da largura, tanto no cabeçalho dos dias da semana quanto nas células.
 * O respiro entre os dias vem do `padding` da célula (que não altera a
 * largura da coluna), nunca de `margin` — margem somada à porcentagem era
 * o que fazia a grade "vazar" e sair do prumo com os dias da semana.
 */
export const COLUMN = '14.2857%' as const;

export function makeCalendarStyles(t: CalendarTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.page },

    // ---- Cabeçalho -------------------------------------------------------
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.lg,
      backgroundColor: t.headerBg,
      borderBottomLeftRadius: Radius.xl,
      borderBottomRightRadius: Radius.xl,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: Radius.md,
      backgroundColor: 'rgba(255, 255, 255, 0.14)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    backIcon: { fontSize: 20, lineHeight: 22, color: t.headerText, fontWeight: '700' },
    /** flex: 1 + textAlign center => o título fica no centro real da barra,
     *  independente da largura do botão de voltar. */
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      ...Type.screenTitle,
      color: t.headerText,
    },
    headerSpacer: { width: 40 },

    content: { flex: 1 },
    contentInner: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.xxxl },

    // ---- Seletor de mês / ano -------------------------------------------
    monthSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.lg,
      backgroundColor: t.surface,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.sm,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: t.line,
      ...shadow(1),
    },
    monthArrow: {
      width: 36,
      height: 36,
      borderRadius: Radius.sm,
      backgroundColor: t.soft,
      justifyContent: 'center',
      alignItems: 'center',
    },
    arrowText: { fontSize: 17, lineHeight: 19, color: t.accent, fontWeight: '700' },
    /** Bloco central elástico: mês e ano ficam sempre centralizados entre
     *  as duas setas, que têm larguras iguais. */
    monthYearGroup: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    monthYearContainer: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
      borderRadius: Radius.pill,
      backgroundColor: t.soft,
    },
    monthYearText: { fontSize: 14, fontWeight: '700', color: t.deep, letterSpacing: 0.2 },

    // ---- Grade -----------------------------------------------------------
    weekDaysContainer: { flexDirection: 'row', marginBottom: Spacing.xs },
    weekDayCell: { width: COLUMN, paddingVertical: Spacing.xs },
    weekDayText: {
      textAlign: 'center',
      fontSize: 11,
      fontWeight: '700',
      color: t.inkSoft,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.xxl },
    /** A célula define a COLUNA (1/7 exato). O padding cria o respiro sem
     *  interferir na largura — é o que mantém tudo no prumo. */
    dayCell: { width: COLUMN, aspectRatio: 1, padding: 2 },
    /** A caixa visual do dia vive dentro da célula. */
    dayBox: {
      flex: 1,
      borderRadius: Radius.sm,
      backgroundColor: t.cell,
      borderWidth: 1,
      borderColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 2,
    },
    dayBoxToday: { backgroundColor: t.accent, borderColor: t.accent },
    dayBoxEvent: { backgroundColor: t.surface, borderColor: t.accent },
    dayNumber: { fontSize: 13, fontWeight: '600', color: t.ink, textAlign: 'center' },
    dayNumberToday: { color: t.onAccent, fontWeight: '700' },
    dayNumberEvent: { color: t.deep, fontWeight: '700' },
    /** Faixa de marcadores com altura fixa: dias com e sem evento ficam com
     *  o número na mesma linha de base, em vez de "pular". */
    dayMarkers: {
      height: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      marginTop: 1,
    },
    eventDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: t.accent },
    eventDotToday: { backgroundColor: t.onAccent },
    moreIndicator: { fontSize: 9, lineHeight: 10, color: t.accent, fontWeight: '700' },
    moreIndicatorToday: { color: t.onAccent },
    activityDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.inkSoft,
      borderWidth: 1,
      borderColor: t.inkSoft,
    },
    activityDotToday: { backgroundColor: t.onAccent, borderColor: t.onAccent },

    // ---- Legenda ---------------------------------------------------------
    legend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.lg,
      marginTop: -Spacing.lg,
      marginBottom: Spacing.xl,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs + 2 },
    legendText: { fontSize: 11, color: t.inkSoft, fontWeight: '600' },

    // ---- Lista de eventos do mês ----------------------------------------
    monthEventsSection: { marginBottom: Spacing.xl },
    sectionTitle: {
      ...Type.sectionTitle,
      color: t.deep,
      marginBottom: Spacing.md,
    },
    emptyEventsCard: {
      backgroundColor: t.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: t.line,
      paddingVertical: Spacing.xxl,
      paddingHorizontal: Spacing.lg,
      alignItems: 'center',
    },
    emptyEventsText: { fontSize: 13, color: t.inkSoft, textAlign: 'center' },
    eventCard: {
      backgroundColor: t.surface,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm + 2,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: t.line,
      ...shadow(1),
    },
    eventCardContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    eventDateBadge: {
      backgroundColor: t.soft,
      width: 44,
      height: 44,
      borderRadius: Radius.sm,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    eventDateText: { fontSize: 17, fontWeight: '700', color: t.deep, textAlign: 'center' },
    eventInfo: { flex: 1, gap: 2 },
    eventTitle: { fontSize: 14, fontWeight: '700', color: t.ink },
    eventTime: { fontSize: 12, color: t.accent, fontWeight: '600' },
    eventDescription: { fontSize: 12, color: t.inkSoft, lineHeight: 16 },
    eventActions: { flexDirection: 'row', alignItems: 'center', marginLeft: Spacing.xs },
    eventActionBtn: {
      width: 34,
      height: 34,
      borderRadius: Radius.xs,
      alignItems: 'center',
      justifyContent: 'center',
    },
    eventActionIcon: { fontSize: 15, lineHeight: 18 },

    // ---- Atividades da casa dentro do modal ------------------------------
    activitiesSection: {
      backgroundColor: t.soft,
      borderRadius: Radius.md,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
    },
    activitiesSectionTitle: { fontSize: 12, fontWeight: '700', color: t.deep, marginBottom: Spacing.sm, letterSpacing: 0.3 },
    activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm - 1 },
    activityCheckbox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: t.accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.sm + 2,
    },
    activityCheckboxDone: { backgroundColor: t.accent },
    activityCheckmark: { fontSize: 12, lineHeight: 14, color: t.onAccent, fontWeight: '700' },
    activityText: { fontSize: 13, color: t.ink, flex: 1, fontWeight: '500' },
    activityTextCompleted: { color: t.inkSoft, textDecorationLine: 'line-through' },

    // ---- Modal de evento -------------------------------------------------
    modalOverlay: { flex: 1, backgroundColor: Sheet.scrim, justifyContent: 'flex-end', alignItems: 'center' },
    modalContent: {
      backgroundColor: Sheet.surface,
      width: '100%',
      maxWidth: APP_MAX_WIDTH,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      paddingBottom: Spacing.sm,
      maxHeight: '92%',
    },
    modalGrabber: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: Sheet.handle,
      marginTop: Spacing.sm + 2,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: Sheet.line,
    },
    modalTitle: { fontSize: 17, fontWeight: '700', color: Sheet.title },
    closeModal: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Sheet.input,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeModalIcon: { fontSize: 15, lineHeight: 17, color: Sheet.muted, fontWeight: '700' },
    modalBody: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
    dateDisplay: {
      backgroundColor: t.soft,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md - 2,
      marginBottom: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dateDisplayLabel: { fontSize: 12, fontWeight: '700', color: t.inkSoft, letterSpacing: 0.4, textTransform: 'uppercase' },
    dateDisplayValue: { fontSize: 15, fontWeight: '700', color: t.deep },
    formGroup: { marginBottom: Spacing.lg },
    label: { ...Type.label, color: Sheet.label, marginBottom: Spacing.sm - 2 },
    input: {
      borderWidth: 1,
      borderColor: Sheet.inputLine,
      backgroundColor: Sheet.input,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md - 2,
      fontSize: 15,
      color: Sheet.title,
    },
    textArea: { minHeight: 84, paddingTop: Spacing.md - 2, textAlignVertical: 'top' },
    modalActions: {
      flexDirection: 'row',
      gap: Spacing.sm + 2,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.xl,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: Spacing.md + 2,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: Sheet.inputLine,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBtnText: { fontSize: 15, fontWeight: '700', color: Sheet.label },
    confirmBtn: {
      flex: 1,
      paddingVertical: Spacing.md + 2,
      borderRadius: Radius.md,
      backgroundColor: t.accent,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow(1),
    },
    confirmBtnDisabled: { opacity: 0.45 },
    confirmBtnText: { fontSize: 15, fontWeight: '700', color: t.onAccent },
    /** Dica embaixo do campo, explicando por que Salvar está desligado. */
    fieldHint: { fontSize: 12, color: Sheet.muted, marginTop: Spacing.sm - 2 },

    // ---- Seletores de mês e ano -----------------------------------------
    pickerOverlay: { flex: 1, backgroundColor: Sheet.scrim, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
    pickerContent: {
      backgroundColor: Sheet.surface,
      borderRadius: Radius.xl,
      padding: Spacing.xl,
      width: '100%',
      maxWidth: 380,
      ...shadow(3),
    },
    pickerTitle: { fontSize: 17, fontWeight: '700', color: Sheet.title, marginBottom: Spacing.lg, textAlign: 'center' },
    /** As colunas do seletor têm largura fixa; assim a última linha
     *  incompleta alinha à esquerda em vez de esticar os botões. */
    pickerRow: { gap: Spacing.sm, marginBottom: Spacing.sm },
    pickerBtn: {
      width: '31.5%',
      paddingVertical: Spacing.md,
      borderRadius: Radius.sm,
      backgroundColor: Sheet.input,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pickerBtnActive: { backgroundColor: t.accent },
    pickerBtnText: { fontSize: 13, fontWeight: '600', color: Sheet.label },
    pickerBtnTextActive: { color: t.onAccent, fontWeight: '700' },
    pickerCloseBtn: {
      backgroundColor: Sheet.input,
      paddingVertical: Spacing.md + 2,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.sm,
    },
    pickerCloseBtnText: { fontSize: 15, fontWeight: '700', color: Sheet.label },
  });
}

export type CalendarStyles = ReturnType<typeof makeCalendarStyles>;

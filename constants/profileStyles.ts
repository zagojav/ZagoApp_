import { StyleSheet } from 'react-native';
import { APP_MAX_WIDTH, HEADER_ACTION_SLOT, Radius, shadow, Sheet, Spacing, Type } from '@/constants/design';
import type { ProfileTheme } from '@/constants/profileTheme';

/**
 * Estilos da tela pessoal, gerados a partir da paleta de cada pessoa.
 *
 * Três correções de alinhamento moram aqui:
 *
 *  1. O cabeçalho reserva `HEADER_ACTION_SLOT` à direita. Os botões de
 *     avatar e de menu ficam em `position: absolute` por cima da tela —
 *     sem essa reserva o nome escorregava para debaixo deles.
 *  2. A tabela de lembretes usa as MESMAS larguras de coluna no cabeçalho
 *     e nas linhas (`col*`), então as colunas finalmente ficam no prumo.
 *  3. Ícones de ação viram alvos de toque quadrados e centralizados, em
 *     vez de emojis soltos com margens diferentes entre si.
 */
export function makeProfileStyles(t: ProfileTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.page },

    // ---- Cabeçalho -------------------------------------------------------
    header: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.xl,
      paddingRight: HEADER_ACTION_SLOT,
      backgroundColor: t.headerBg,
      borderBottomLeftRadius: Radius.xl,
      borderBottomRightRadius: Radius.xl,
    },
    headerName: {
      fontSize: 26,
      fontWeight: '700',
      color: t.headerTitle,
      letterSpacing: 0.4,
    },
    headerSubtitle: { fontSize: 13, color: t.headerSubtitle, marginTop: 3, fontWeight: '500' },

    content: { flex: 1 },
    contentInner: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg },

    // ---- Estatísticas ----------------------------------------------------
    statsCard: {
      backgroundColor: t.statsBg,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.xl,
      marginBottom: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      ...shadow(1),
    },
    statItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    statDivider: { width: 1, alignSelf: 'stretch', marginVertical: Spacing.xs, backgroundColor: t.statsDivider },
    statNumber: { fontSize: 30, fontWeight: '700', color: t.statsText, lineHeight: 34 },
    statLabel: {
      fontSize: 11,
      color: t.statsLabel,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginTop: Spacing.xs,
    },

    // ---- Progresso -------------------------------------------------------
    progressContainer: { marginBottom: Spacing.lg },
    progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
    progressLabel: { fontSize: 12, color: t.textOnPage, fontWeight: '600', letterSpacing: 0.3 },
    progressText: { fontSize: 12, color: t.title, fontWeight: '700' },
    progressBar: { height: 8, backgroundColor: t.track, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4, backgroundColor: t.fill },

    // ---- Mensagem motivacional ------------------------------------------
    motivationalCard: {
      backgroundColor: t.card,
      borderRadius: Radius.md,
      paddingVertical: Spacing.md + 2,
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.xxl,
      borderLeftWidth: 3,
      borderLeftColor: t.fill,
    },
    motivationalText: { fontSize: 13, color: t.text, fontWeight: '500', lineHeight: 19 },

    // ---- Seções ----------------------------------------------------------
    section: { marginBottom: Spacing.xxl },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    sectionTitle: { ...Type.sectionTitle, color: t.title, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 12 },
    addSmallBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: t.accent,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadow(1),
    },
    addSmallIcon: { fontSize: 19, lineHeight: 21, color: t.onAccent, fontWeight: '700' },
    emptyCard: {
      backgroundColor: t.card,
      borderRadius: Radius.md,
      paddingVertical: Spacing.xxl,
      paddingHorizontal: Spacing.lg,
      alignItems: 'center',
    },
    emptyText: { fontSize: 13, color: t.textMuted, textAlign: 'center' },

    // ---- Tarefas ---------------------------------------------------------
    taskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.card,
      borderRadius: Radius.md,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md + 2,
      marginBottom: Spacing.sm,
    },
    taskItemCompleted: { backgroundColor: t.cardSunken },
    taskCheckbox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: t.onCardAccent,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    taskCheckboxDone: { backgroundColor: t.onCardAccent },
    taskCheckmark: { fontSize: 12, lineHeight: 14, color: t.card, fontWeight: '700' },
    taskBody: { flex: 1, justifyContent: 'center' },
    taskText: { fontSize: 14, fontWeight: '600', color: t.text, lineHeight: 19 },
    taskTextCompleted: { color: t.textMuted, textDecorationLine: 'line-through' },
    /** Selo "atividade da casa": fundo suave + cor de destaque legível.
     *  Antes usava a mesma cor do cartão e sumia por completo. */
    orgTaskBadge: {
      alignSelf: 'flex-start',
      marginTop: Spacing.xs + 2,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: Radius.pill,
      backgroundColor: t.accentSoft,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.4,
      color: t.onCardAccent,
      overflow: 'hidden',
    },
    taskActionBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    taskActionIcon: { fontSize: 15, lineHeight: 18 },

    // ---- Lembretes (tabela) ---------------------------------------------
    notesTable: { backgroundColor: t.card, borderRadius: Radius.md, overflow: 'hidden' },
    tableHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm + 2,
      paddingHorizontal: Spacing.md + 2,
      backgroundColor: t.cardSunken,
      gap: Spacing.sm + 2,
    },
    tableHeaderText: {
      fontSize: 10,
      fontWeight: '700',
      color: t.textMuted,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md - 2,
      paddingHorizontal: Spacing.md + 2,
      borderTopWidth: 1,
      borderTopColor: t.line,
      gap: Spacing.sm + 2,
    },
    /** Larguras de coluna compartilhadas entre cabeçalho e linhas. */
    colCheck: { width: 22 },
    colSubject: { flex: 2 },
    colDate: { flex: 1 },
    colActions: { width: 30 },
    cellText: { fontSize: 13, color: t.text, fontWeight: '500' },
    cellDate: { fontSize: 12, color: t.textMuted, fontWeight: '600' },
    reminderCheckbox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: t.onCardAccent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    reminderCheckIcon: { fontSize: 11, lineHeight: 13, color: t.card, fontWeight: '700' },
    reminderCheckboxDone: { backgroundColor: t.onCardAccent, borderColor: t.onCardAccent },
    cellTextDone: { color: t.textMuted, textDecorationLine: 'line-through' },
    /** Cabeçalho da gaveta "Concluídos" — o lugar para onde vão os
     *  lembretes marcados, em vez de eles simplesmente sumirem. */
    completedToggle: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xs },
    completedToggleText: { fontSize: 12, fontWeight: '700', color: t.textOnPage, letterSpacing: 0.4 },
    deleteNoteBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
    deleteNoteIcon: { fontSize: 14, lineHeight: 17 },

    // ---- Acesso rápido ---------------------------------------------------
    quickLinksSection: { marginBottom: Spacing.xl },
    linksContainer: { gap: Spacing.sm + 2 },
    quickLink: {
      backgroundColor: t.card,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      borderRadius: Radius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderLeftWidth: 3,
      borderLeftColor: t.fill,
    },
    quickLinkText: { fontSize: 14, fontWeight: '600', color: t.text },
    quickLinkChevron: { fontSize: 17, lineHeight: 19, color: t.onCardAccent, fontWeight: '700' },

    // ---- Rodapé ----------------------------------------------------------
    footerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.sm,
      paddingBottom: Spacing.xl,
    },
    footerImage: { width: '100%', height: 230 },

    // ---- Modais ----------------------------------------------------------
    modalOverlay: { flex: 1, backgroundColor: Sheet.scrim, justifyContent: 'flex-end', alignItems: 'center' },
    modalContent: {
      backgroundColor: Sheet.surface,
      width: '100%',
      maxWidth: APP_MAX_WIDTH,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      paddingBottom: Spacing.sm,
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
    modalActions: {
      flexDirection: 'row',
      gap: Spacing.sm + 2,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.sm,
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
  });
}

export type ProfileStyles = ReturnType<typeof makeProfileStyles>;

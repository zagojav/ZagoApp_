import { StyleSheet } from 'react-native';
import { APP_MAX_WIDTH, Casa, Radius, shadow, Sheet, Spacing, Type } from '@/constants/design';

/**
 * Estilos compartilhados pelas telas "da casa" — Listas, Mercado, Farmácia,
 * Pets, Afazeres e a seleção de perfil.
 *
 * Antes cada uma dessas telas repetia o mesmo cabeçalho, o mesmo chip e o
 * mesmo modal com números ligeiramente diferentes (15 aqui, 14 ali, raio 12
 * numa tela e 20 na outra). Agora todas puxam daqui, então a navegação entre
 * elas parece contínua em vez de um remendo de telas parecidas.
 */
export const casa = StyleSheet.create({
  container: { flex: 1, backgroundColor: Casa.page },

  // ---- Cabeçalho ---------------------------------------------------------
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  /** Título elástico: empurra as ações para as pontas e mantém o texto
   *  alinhado à esquerda sem nunca encostar nos botões. */
  headerTitleFlex: { flex: 1, ...Type.screenTitle, color: Casa.ink },
  /** Título realmente centralizado entre duas ações de mesma largura. */
  headerTitleCentered: { flex: 1, textAlign: 'center', ...Type.screenTitle, color: Casa.ink },

  /** Botão quadrado de ação no cabeçalho (voltar). */
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnText: { fontSize: 19, lineHeight: 21, color: Casa.ink, fontWeight: '700' },

  /** Botão circular de ação principal (adicionar). */
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Casa.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow(1),
  },
  addIcon: { fontSize: 24, lineHeight: 26, color: Casa.onAccent, fontWeight: '700' },

  // ---- Chips / filtros ---------------------------------------------------
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.sm - 1,
    borderRadius: Radius.pill,
    backgroundColor: Casa.chipIdle,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: { backgroundColor: Casa.accent, borderColor: Casa.accent },
  chipText: { fontSize: 12, color: Casa.ink, fontWeight: '600' },
  chipTextActive: { color: Casa.onAccent },
  filterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Casa.inkMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // ---- Estados vazios ----------------------------------------------------
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxxl + Spacing.lg },
  emptyText: { fontSize: 15, color: Casa.ink, fontWeight: '600', opacity: 0.75 },
  emptySubtext: { fontSize: 12, color: Casa.ink, opacity: 0.55, marginTop: Spacing.xs + 2 },

  // ---- Modal (sheet) -----------------------------------------------------
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

  formGroup: { marginBottom: Spacing.lg },
  formLabel: { ...Type.label, color: Sheet.label, marginBottom: Spacing.sm - 2 },
  formInput: {
    borderWidth: 1,
    borderColor: Sheet.inputLine,
    backgroundColor: Sheet.input,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md - 2,
    fontSize: 15,
    color: Sheet.title,
  },
  /** Chips dentro do modal, sobre fundo branco. */
  sheetChip: {
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.sm + 1,
    borderRadius: Radius.pill,
    backgroundColor: Sheet.input,
    borderWidth: 1,
    borderColor: Sheet.inputLine,
  },
  sheetChipActive: { backgroundColor: Casa.accent, borderColor: Casa.accent },
  sheetChipText: { fontSize: 13, fontWeight: '600', color: Sheet.label },
  sheetChipTextActive: { color: Casa.onAccent },

  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm + 2,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
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
    backgroundColor: Casa.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow(1),
  },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: Casa.onAccent },
});

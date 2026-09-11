import React, { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShoppingItems } from '@/hooks/useShoppingItems';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { PERSON_PROFILES } from '@/constants/personProfiles';
import { casa } from '@/constants/casaStyles';
import { Casa, Radius, Sheet, Spacing, shadow } from '@/constants/design';
import { showConfirm } from '@/utils/alert';
import type { ShoppingCategory, ShoppingItem, ShoppingUnit } from '@/types/database';

const CATEGORIES: ShoppingCategory[] = ['Compra do mês', 'Compra da semana', 'Compra de necessidade'];
const UNITS: ShoppingUnit[] = ['un', 'kg', 'g', 'L', 'ml', 'pacote', 'caixa'];

/** Mostra '2 kg' ou '1 un', e anexa o texto que veio do formato antigo. */
function quantityLabel(item: ShoppingItem): string {
  const base = `${item.quantity} ${item.unit}`;
  return item.quantityNote ? `${base} · ${item.quantityNote}` : base;
}

export default function MercadoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeProfileId } = useActiveProfile();
  const {
    items,
    loading,
    addItem,
    updateItem,
    removeItem,
    toggleCollected,
    clearCollected,
  } = useShoppingItems('mercado');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formQuantity, setFormQuantity] = useState('1');
  const [formUnit, setFormUnit] = useState<ShoppingUnit>('un');
  const [formCategory, setFormCategory] = useState<ShoppingCategory>('Compra da semana');
  const [isShoppingMode, setIsShoppingMode] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(CATEGORIES));
  const [completionModalVisible, setCompletionModalVisible] = useState(false);

  const filteredItems = useMemo(
    () => items.filter(item => selectedCategories.has(item.category)),
    [items, selectedCategories]
  );
  const itemsCollected = filteredItems.filter(item => item.collected);

  const parsedQuantity = Number(formQuantity.replace(',', '.'));
  const quantityValid = Number.isFinite(parsedQuantity) && parsedQuantity > 0;
  const formValid = formName.trim().length > 0 && quantityValid;

  const handleAddItem = async () => {
    if (!formValid || !activeProfileId) return;
    const payload = {
      product: formName.trim(),
      quantity: parsedQuantity,
      unit: formUnit,
      category: formCategory,
      aisle: 'Outros' as const,
      gtin: null,
      brand: null,
    };

    if (editingItemId) {
      await updateItem(editingItemId, payload);
    } else {
      await addItem(payload, activeProfileId, PERSON_PROFILES[activeProfileId].name);
    }

    setModalVisible(false);
    setEditingItemId(null);
    setFormName('');
    setFormQuantity('1');
    setFormUnit('un');
    setFormCategory('Compra da semana');
  };

  const handleDeleteItem = (item: ShoppingItem) => {
    showConfirm(
      {
        title: 'Excluir item',
        message: `Excluir "${item.product}" da lista? Isso não tem como desfazer.`,
        confirmText: 'Excluir',
        destructive: true,
      },
      () => { removeItem(item.id); }
    );
  };

  const handleToggleItem = async (item: ShoppingItem) => {
    if (!activeProfileId) return;
    await toggleCollected(item, activeProfileId, PERSON_PROFILES[activeProfileId].name);

    // Só comemora quando o item marcado foi o último que faltava.
    const remaining = filteredItems.filter(i => i.id !== item.id && !i.collected);
    if (!item.collected && remaining.length === 0) {
      setTimeout(() => setCompletionModalVisible(true), 300);
    }
  };

  const openEditModal = (item: ShoppingItem) => {
    setEditingItemId(item.id);
    setFormName(item.product);
    setFormQuantity(String(item.quantity));
    setFormUnit(item.unit);
    setFormCategory(item.category);
    setModalVisible(true);
  };

  const openNewModal = () => {
    setEditingItemId(null);
    setFormName('');
    setFormQuantity('1');
    setFormUnit('un');
    setFormCategory('Compra da semana');
    setModalVisible(true);
  };

  const toggleCategory = (category: string) => {
    const next = new Set(selectedCategories);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    setSelectedCategories(next);
  };

  const resetCollected = async () => {
    await clearCollected(filteredItems.filter(i => i.collected).map(i => i.id));
    setCompletionModalVisible(false);
    setIsShoppingMode(false);
  };

  return (
    <View style={casa.container}>
      <View style={[casa.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity style={casa.iconBtn} onPress={() => router.back()} activeOpacity={0.75} accessibilityRole="button" accessibilityLabel="Voltar">
          <Text style={casa.iconBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={casa.headerTitleCentered} numberOfLines={1}>Mercado</Text>
        <TouchableOpacity style={casa.addBtn} onPress={openNewModal} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Adicionar item">
          <Text style={casa.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll} contentContainerStyle={styles.categoriesContent}>
        {CATEGORIES.map(category => (
          <TouchableOpacity
            key={category}
            style={[casa.chip, selectedCategories.has(category) && casa.chipActive]}
            onPress={() => toggleCategory(category)}
            activeOpacity={0.75}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selectedCategories.has(category) }}
            accessibilityLabel={category}
          >
            <Text style={[casa.chipText, selectedCategories.has(category) && casa.chipTextActive]}>{category}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.modeContainer}>
        <TouchableOpacity
          style={[styles.modeButton, isShoppingMode && styles.modeButtonActive]}
          onPress={() => setIsShoppingMode(!isShoppingMode)}
          activeOpacity={0.8}
          accessibilityRole="switch"
          accessibilityState={{ checked: isShoppingMode }}
        >
          <Text style={[styles.modeButtonText, isShoppingMode && styles.modeButtonTextActive]}>
            {isShoppingMode ? '✓ Estou no Mercado' : 'Estou no Mercado'}
          </Text>
        </TouchableOpacity>

        {isShoppingMode && filteredItems.length > 0 && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>{itemsCollected.length} de {filteredItems.length} itens coletados</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(itemsCollected.length / filteredItems.length) * 100}%` }]} />
            </View>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={casa.emptyState}>
            <ActivityIndicator size="large" color={Casa.accent} />
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={casa.emptyState}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={casa.emptyText}>
              {items.length === 0 ? 'Nenhum item na lista ainda' : 'Nenhum item nessas categorias'}
            </Text>
            <Text style={casa.emptySubtext}>
              {items.length === 0 ? 'Toque no + para adicionar o primeiro' : 'Ative outra categoria acima'}
            </Text>
          </View>
        ) : (
          filteredItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[styles.itemCard, item.collected && styles.itemCardCollected]}
              onPress={() => isShoppingMode && handleToggleItem(item)}
              activeOpacity={isShoppingMode ? 0.7 : 1}
              accessibilityRole={isShoppingMode ? 'checkbox' : undefined}
              accessibilityState={isShoppingMode ? { checked: item.collected } : undefined}
              accessibilityLabel={item.product}
            >
              {isShoppingMode && (
                <View style={[styles.checkbox, item.collected && styles.checkboxDone]}>
                  {item.collected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              )}
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, item.collected && styles.itemNameCollected]}>{item.product}</Text>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemQuantity}>{quantityLabel(item)}</Text>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                </View>
                {item.collected && item.collectedByName ? (
                  <Text style={styles.itemCollectedBy}>pego por {item.collectedByName}</Text>
                ) : null}
              </View>
              {!isShoppingMode && (
                <View style={styles.itemActions}>
                  <TouchableOpacity onPress={() => openEditModal(item)} style={styles.itemActionBtn} activeOpacity={0.6} accessibilityRole="button" accessibilityLabel={`Editar ${item.product}`}>
                    <Text style={styles.itemActionIcon}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteItem(item)} style={styles.itemActionBtn} activeOpacity={0.6} accessibilityRole="button" accessibilityLabel={`Excluir ${item.product}`}>
                    <Text style={styles.itemActionIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={casa.modalOverlay}>
          <View style={casa.modalContent}>
            <View style={casa.modalGrabber} />
            <View style={casa.modalHeader}>
              <Text style={casa.modalTitle}>{editingItemId ? 'Editar item' : 'Novo item'}</Text>
              <TouchableOpacity style={casa.closeModal} onPress={() => setModalVisible(false)} activeOpacity={0.6} accessibilityRole="button" accessibilityLabel="Fechar">
                <Text style={casa.closeModalIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={casa.modalBody} showsVerticalScrollIndicator={false}>
              <View style={casa.formGroup}>
                <Text style={casa.formLabel}>Produto *</Text>
                <TextInput
                  style={casa.formInput}
                  placeholder="Ex: arroz, leite..."
                  value={formName}
                  onChangeText={setFormName}
                  placeholderTextColor={Sheet.placeholder}
                  accessibilityLabel="Nome do produto"
                />
                {!formName.trim() && <Text style={styles.fieldHint}>O nome do produto é obrigatório.</Text>}
              </View>

              <View style={styles.quantityRow}>
                <View style={styles.quantityField}>
                  <Text style={casa.formLabel}>Quantidade *</Text>
                  <TextInput
                    style={casa.formInput}
                    placeholder="1"
                    value={formQuantity}
                    onChangeText={setFormQuantity}
                    keyboardType="decimal-pad"
                    placeholderTextColor={Sheet.placeholder}
                    accessibilityLabel="Quantidade"
                  />
                </View>
              </View>
              {!quantityValid && <Text style={styles.fieldHint}>Informe um número maior que zero.</Text>}

              <View style={casa.formGroup}>
                <Text style={casa.formLabel}>Unidade</Text>
                <View style={styles.optionRow}>
                  {UNITS.map(unit => (
                    <TouchableOpacity
                      key={unit}
                      style={[casa.sheetChip, formUnit === unit && casa.sheetChipActive]}
                      onPress={() => setFormUnit(unit)}
                      activeOpacity={0.75}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: formUnit === unit }}
                      accessibilityLabel={unit}
                    >
                      <Text style={[casa.sheetChipText, formUnit === unit && casa.sheetChipTextActive]}>{unit}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={casa.formGroup}>
                <Text style={casa.formLabel}>Categoria</Text>
                <View style={styles.optionRow}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[casa.sheetChip, formCategory === cat && casa.sheetChipActive]}
                      onPress={() => setFormCategory(cat)}
                      activeOpacity={0.75}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: formCategory === cat }}
                      accessibilityLabel={cat}
                    >
                      <Text style={[casa.sheetChipText, formCategory === cat && casa.sheetChipTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            <View style={casa.modalActions}>
              <TouchableOpacity style={casa.cancelBtn} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <Text style={casa.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[casa.confirmBtn, !formValid && styles.confirmBtnDisabled]}
                onPress={handleAddItem}
                disabled={!formValid}
                activeOpacity={0.85}
              >
                <Text style={casa.confirmBtnText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={completionModalVisible} transparent animationType="fade" onRequestClose={() => setCompletionModalVisible(false)}>
        <View style={styles.completionOverlay}>
          <View style={styles.completionModal}>
            <Text style={styles.completionEmoji}>🎉</Text>
            <Text style={styles.completionTitle}>Parabéns!</Text>
            <Text style={styles.completionText}>Todos os itens foram colocados no carrinho!</Text>
            <TouchableOpacity style={styles.completionBtn} onPress={resetCollected} activeOpacity={0.85}>
              <Text style={casa.confirmBtnText}>Pronto</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  categoriesScroll: { flexGrow: 0 },
  categoriesContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm, gap: Spacing.sm },
  modeContainer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, gap: Spacing.md },
  modeButton: {
    backgroundColor: Casa.surfaceWarm,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeButtonActive: { backgroundColor: Casa.accent, borderColor: Casa.accent },
  modeButtonText: { fontSize: 14, fontWeight: '700', color: Casa.ink },
  modeButtonTextActive: { color: Casa.onAccent },
  progressContainer: { gap: Spacing.sm - 2 },
  progressText: { fontSize: 12, color: Casa.ink, fontWeight: '600' },
  progressBar: { height: 8, backgroundColor: 'rgba(42, 32, 24, 0.14)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: Casa.accent },
  content: { flex: 1 },
  contentInner: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.xxxl },
  emptyIcon: { fontSize: 32, lineHeight: 38, marginBottom: Spacing.md, opacity: 0.6 },
  itemCard: {
    backgroundColor: Casa.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md + 2,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm,
    marginBottom: Spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...shadow(1),
  },
  itemCardCollected: { backgroundColor: Casa.surfaceSunken },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Casa.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDone: { backgroundColor: Casa.accent },
  checkmark: { fontSize: 12, lineHeight: 14, color: Casa.onAccent, fontWeight: '700' },
  itemInfo: { flex: 1, gap: 3 },
  itemName: { fontSize: 15, fontWeight: '600', color: Casa.ink },
  itemNameCollected: { color: Casa.inkFaint, textDecorationLine: 'line-through' },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  itemQuantity: { fontSize: 11, color: Casa.inkMuted, fontWeight: '600' },
  itemCategory: { fontSize: 11, color: Casa.inkFaint },
  itemCollectedBy: { fontSize: 10, color: Casa.inkFaint, fontStyle: 'italic' },
  itemActions: { flexDirection: 'row', alignItems: 'center' },
  itemActionBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  itemActionIcon: { fontSize: 15, lineHeight: 18 },
  quantityRow: { flexDirection: 'row', gap: Spacing.md },
  quantityField: { flex: 1, marginBottom: Spacing.lg },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  fieldHint: { fontSize: 12, color: Sheet.muted, marginTop: -Spacing.md, marginBottom: Spacing.md },
  confirmBtnDisabled: { opacity: 0.45 },
  completionOverlay: { flex: 1, backgroundColor: Sheet.scrim, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  completionModal: {
    backgroundColor: Sheet.surface,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    ...shadow(3),
  },
  completionEmoji: { fontSize: 52, lineHeight: 62, marginBottom: Spacing.lg },
  completionTitle: { fontSize: 22, fontWeight: '700', color: Sheet.title, marginBottom: Spacing.sm },
  completionText: { fontSize: 14, color: Sheet.muted, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 20 },
  completionBtn: {
    backgroundColor: Casa.accent,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.md,
    ...shadow(1),
  },
});

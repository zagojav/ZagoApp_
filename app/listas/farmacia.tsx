import React, { useState } from 'react';
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
import type { ShoppingItem, ShoppingUnit } from '@/types/database';

const UNITS: ShoppingUnit[] = ['un', 'caixa', 'pacote', 'ml', 'g'];

function quantityLabel(item: ShoppingItem): string {
  const base = `${item.quantity} ${item.unit}`;
  return item.quantityNote ? `${base} · ${item.quantityNote}` : base;
}

export default function FarmaciaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeProfileId } = useActiveProfile();
  const { items, loading, addItem, updateItem, removeItem } = useShoppingItems('farmacia');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formQuantity, setFormQuantity] = useState('1');
  const [formUnit, setFormUnit] = useState<ShoppingUnit>('un');

  const parsedQuantity = Number(formQuantity.replace(',', '.'));
  const quantityValid = Number.isFinite(parsedQuantity) && parsedQuantity > 0;
  const formValid = formName.trim().length > 0 && quantityValid;

  const handleAddItem = async () => {
    if (!formValid || !activeProfileId) return;
    const payload = {
      product: formName.trim(),
      quantity: parsedQuantity,
      unit: formUnit,
      category: 'Compra de necessidade' as const,
      aisle: 'Higiene' as const,
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

  const openEditModal = (item: ShoppingItem) => {
    setEditingItemId(item.id);
    setFormName(item.product);
    setFormQuantity(String(item.quantity));
    setFormUnit(item.unit);
    setModalVisible(true);
  };

  const openNewModal = () => {
    setEditingItemId(null);
    setFormName('');
    setFormQuantity('1');
    setFormUnit('un');
    setModalVisible(true);
  };

  return (
    <View style={casa.container}>
      <View style={[casa.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity style={casa.iconBtn} onPress={() => router.back()} activeOpacity={0.75} accessibilityRole="button" accessibilityLabel="Voltar">
          <Text style={casa.iconBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={casa.headerTitleCentered} numberOfLines={1}>Farmácia</Text>
        <TouchableOpacity style={casa.addBtn} onPress={openNewModal} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Adicionar item">
          <Text style={casa.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={casa.emptyState}>
            <ActivityIndicator size="large" color={Casa.accent} />
          </View>
        ) : items.length === 0 ? (
          <View style={casa.emptyState}>
            <Text style={styles.emptyIcon}>💊</Text>
            <Text style={casa.emptyText}>Nenhum item adicionado</Text>
            <Text style={casa.emptySubtext}>Toque no + para adicionar o primeiro</Text>
          </View>
        ) : (
          items.map(item => (
            <TouchableOpacity key={item.id} style={styles.itemCard} onPress={() => openEditModal(item)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`Editar ${item.product}`}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product}</Text>
                <Text style={styles.itemQuantity}>{quantityLabel(item)}</Text>
              </View>
              <TouchableOpacity style={styles.itemActionBtn} onPress={() => handleDeleteItem(item)} activeOpacity={0.6} accessibilityRole="button" accessibilityLabel={`Excluir ${item.product}`}>
                <Text style={styles.itemActionIcon}>🗑️</Text>
              </TouchableOpacity>
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
            <View style={casa.modalBody}>
              <View style={casa.formGroup}>
                <Text style={casa.formLabel}>Produto *</Text>
                <TextInput
                  style={casa.formInput}
                  placeholder="Ex: dipirona, band-aid..."
                  value={formName}
                  onChangeText={setFormName}
                  placeholderTextColor={Sheet.placeholder}
                  accessibilityLabel="Nome do produto"
                />
                {!formName.trim() && <Text style={styles.fieldHint}>O nome do produto é obrigatório.</Text>}
              </View>

              <View style={casa.formGroup}>
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
                {!quantityValid && <Text style={styles.fieldHint}>Informe um número maior que zero.</Text>}
              </View>

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
            </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
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
  itemInfo: { flex: 1, gap: 3 },
  itemName: { fontSize: 15, fontWeight: '600', color: Casa.ink },
  itemQuantity: { fontSize: 11, color: Casa.inkMuted, fontWeight: '600' },
  itemActionBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  itemActionIcon: { fontSize: 15, lineHeight: 18 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  fieldHint: { fontSize: 12, color: Sheet.muted, marginTop: Spacing.sm - 2 },
  confirmBtnDisabled: { opacity: 0.45 },
});

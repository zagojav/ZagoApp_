import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, ScrollView, ActivityIndicator,
} from 'react-native';
import { useMarkets } from '@/hooks/useMarkets';
import { useMarketSession, type MarketSession } from '@/context/MarketSessionContext';

interface MarketPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelected?: (market: MarketSession) => void;
}

/**
 * "Em qual mercado você está agora?" — aparece ao entrar na área de preços
 * sem mercado na sessão, e pelo botão "Trocar" a qualquer momento.
 */
export function MarketPickerModal({ visible, onClose, onSelected }: MarketPickerModalProps) {
  const { markets, loading, addMarket } = useMarkets();
  const { market: currentMarket, setMarket } = useMarketSession();

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (marketId: string, marketName: string) => {
    const selection = { marketId, marketName };
    await setMarket(selection);
    onSelected?.(selection);
    onClose();
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      setError('Dá um nome pro mercado.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const created = await addMarket(name, newLocation);
      setNewName('');
      setNewLocation('');
      setAdding(false);
      await handleSelect(created.id, created.name);
    } catch {
      setError('Não consegui salvar. Confira a internet.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setAdding(false);
    setNewName('');
    setNewLocation('');
    setError(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Qual mercado você está agora?</Text>
              <Text style={styles.subtitle}>
                Os preços que você escanear vão ficar vinculados a ele.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {loading ? (
              <ActivityIndicator color="#c9a876" style={styles.loader} />
            ) : (
              <>
                {markets.length === 0 && !adding && (
                  <Text style={styles.empty}>
                    Nenhum mercado cadastrado ainda. Adiciona o primeiro aí embaixo.
                  </Text>
                )}

                {markets.map((market) => {
                  const isCurrent = currentMarket?.marketId === market.id;
                  return (
                    <TouchableOpacity
                      key={market.id}
                      style={[styles.marketRow, isCurrent && styles.marketRowActive]}
                      onPress={() => handleSelect(market.id, market.name)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.marketInfo}>
                        <Text style={[styles.marketName, isCurrent && styles.marketNameActive]}>
                          {market.name}
                        </Text>
                        {!!market.location && (
                          <Text style={styles.marketLocation}>{market.location}</Text>
                        )}
                      </View>
                      {isCurrent && <Text style={styles.currentBadge}>atual</Text>}
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {adding ? (
              <View style={styles.form}>
                <Text style={styles.label}>Nome do mercado</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: São Vicente"
                  placeholderTextColor="#bbb"
                  value={newName}
                  onChangeText={setNewName}
                  autoFocus
                  returnKeyType="next"
                />
                <Text style={styles.label}>Bairro / cidade (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Barueri"
                  placeholderTextColor="#bbb"
                  value={newLocation}
                  onChangeText={setNewLocation}
                  returnKeyType="done"
                  onSubmitEditing={handleCreate}
                />
                {!!error && <Text style={styles.error}>{error}</Text>}
                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={resetForm} disabled={saving}>
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmBtn, saving && styles.btnDisabled]}
                    onPress={handleCreate}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.confirmBtnText}>Salvar e usar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.addRow} onPress={() => setAdding(true)}>
                <Text style={styles.addRowText}>+ Adicionar novo mercado</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  headerText: { flex: 1, paddingRight: 10 },
  title: { fontSize: 18, fontWeight: '600', color: '#2a2a2a' },
  subtitle: { fontSize: 12, color: '#888', marginTop: 4 },
  close: { fontSize: 22, color: '#999' },
  list: { paddingHorizontal: 20 },
  listContent: { paddingVertical: 16, gap: 10 },
  loader: { paddingVertical: 30 },
  empty: { fontSize: 13, color: '#999', fontStyle: 'italic', textAlign: 'center', paddingVertical: 16 },
  marketRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#f7f4ef', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 2, borderColor: 'transparent',
  },
  marketRowActive: { borderColor: '#c9a876', backgroundColor: '#f3e9d7' },
  marketInfo: { flex: 1 },
  marketName: { fontSize: 15, fontWeight: '600', color: '#2a2a2a' },
  marketNameActive: { color: '#8a6d3b' },
  marketLocation: { fontSize: 12, color: '#999', marginTop: 2 },
  currentBadge: {
    fontSize: 10, fontWeight: '700', color: '#fff', backgroundColor: '#c9a876',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden',
  },
  addRow: {
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed',
  },
  addRowText: { fontSize: 14, fontWeight: '600', color: '#8a6d3b' },
  form: { backgroundColor: '#f7f4ef', borderRadius: 12, padding: 16, gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: '#2a2a2a', marginTop: 4 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10, backgroundColor: '#fff',
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#2a2a2a',
  },
  error: { fontSize: 12, color: '#c0392b', marginTop: 4 },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1,
    borderColor: '#ddd', alignItems: 'center', backgroundColor: '#fff',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#2a2a2a' },
  confirmBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#c9a876',
    alignItems: 'center', justifyContent: 'center',
  },
  confirmBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  btnDisabled: { opacity: 0.6 },
});

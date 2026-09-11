import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMarketSession } from '@/context/MarketSessionContext';
import { MarketPickerModal } from '@/components/market/MarketPickerModal';
import { usePriceItems } from '@/hooks/usePriceItems';
import {
  groupByMarket, getComparisons, totalPotentialSavings, cheapestPrice,
} from '@/utils/priceComparison';
import { formatPrice } from '@/utils/priceParser';
import { showConfirm } from '@/utils/alert';

type PriceTab = 'mercados' | 'comparacao';

interface PriceListViewProps {
  /** Espaço extra no fim da lista pra o botão flutuante não cobrir o último item. */
  bottomInset: number;
}

/**
 * A aba "Preços" do Mercado: barra do mercado atual, lista agrupada por loja,
 * comparação entre lojas e o botão de escanear.
 *
 * É componente e não tela porque vive dentro do Mercado — a pessoa alterna
 * entre a lista de compras e os preços sem sair da mesma tela.
 */
export function PriceListView({ bottomInset }: PriceListViewProps) {
  const router = useRouter();

  const { market, loading: marketLoading } = useMarketSession();
  const { items, loading, removeMarketPrice, deleteItem } = usePriceItems();

  const [tab, setTab] = useState<PriceTab>('mercados');
  const [pickerVisible, setPickerVisible] = useState(false);

  const groups = useMemo(() => groupByMarket(items), [items]);
  const comparisons = useMemo(() => getComparisons(items), [items]);
  const savings = useMemo(() => totalPotentialSavings(comparisons), [comparisons]);
  const singlePriceItems = useMemo(() => items.filter((item) => item.prices.length === 1), [items]);

  // Primeira vez na aba sem loja escolhida: pergunta qual é antes de mais nada.
  useEffect(() => {
    if (!marketLoading && !market) setPickerVisible(true);
  }, [marketLoading, market]);

  const handleScan = () => {
    if (!market) {
      setPickerVisible(true);
      return;
    }
    router.push('/listas/scan-preco');
  };

  const handleRemovePrice = (
    itemId: string, marketId: string, productName: string, marketName: string
  ) => {
    showConfirm(
      {
        title: 'Remover preço',
        message: `Apagar o preço de "${productName}" em ${marketName}?`,
        confirmText: 'Remover',
        destructive: true,
      },
      () => { void removeMarketPrice(itemId, marketId); }
    );
  };

  const handleDeleteItem = (itemId: string, productName: string) => {
    showConfirm(
      {
        title: 'Apagar produto',
        message: `Apagar "${productName}" e todos os preços dele?`,
        confirmText: 'Apagar',
        destructive: true,
      },
      () => { void deleteItem(itemId); }
    );
  };

  return (
    <View style={styles.container}>
      {/* Mercado atual — trocar acessível a qualquer momento */}
      <TouchableOpacity
        style={styles.marketBar}
        onPress={() => setPickerVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.marketBarText} numberOfLines={1}>
          📍 {market?.marketName ?? 'Escolher mercado'}
        </Text>
        <Text style={styles.marketBarAction}>trocar</Text>
      </TouchableOpacity>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'mercados' && styles.tabActive]}
          onPress={() => setTab('mercados')}
        >
          <Text style={[styles.tabText, tab === 'mercados' && styles.tabTextActive]}>
            Por mercado
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'comparacao' && styles.tabActive]}
          onPress={() => setTab('comparacao')}
        >
          <Text style={[styles.tabText, tab === 'comparacao' && styles.tabTextActive]}>
            Comparação{comparisons.length > 0 ? ` (${comparisons.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#c9a876" size="large" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🏷️</Text>
          <Text style={styles.emptyTitle}>Nenhum preço ainda</Text>
          <Text style={styles.emptyText}>
            Escaneie a etiqueta de um produto e ele aparece aqui, junto com onde
            está mais barato.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentInner, { paddingBottom: bottomInset + 100 }]}
        >
          {tab === 'mercados' ? (
            groups.map((group) => (
              <View key={group.marketId} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>🏪 {group.marketName}</Text>
                  <Text style={styles.cardMeta}>
                    {group.entries.length} {group.entries.length === 1 ? 'item' : 'itens'}
                  </Text>
                </View>

                {group.entries.map((entry) => (
                  <TouchableOpacity
                    key={`${group.marketId}-${entry.item.id}`}
                    style={styles.row}
                    onLongPress={() =>
                      handleRemovePrice(
                        entry.item.id, group.marketId, entry.item.productName, group.marketName
                      )
                    }
                    delayLongPress={500}
                    activeOpacity={0.7}
                  >
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowName} numberOfLines={2}>
                        {entry.item.productName}
                      </Text>
                      <Text style={styles.rowCategory}>{entry.item.category}</Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Text style={[styles.rowPrice, entry.isCheapest && styles.rowPriceCheapest]}>
                        {formatPrice(entry.price)}
                      </Text>
                      {entry.isCheapest && entry.item.prices.length > 1 && (
                        <Text style={styles.cheapestTag}>✅ mais barato</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          ) : (
            <>
              {savings > 0 && (
                <View style={styles.savingsCard}>
                  <Text style={styles.savingsLabel}>Comprando cada item onde é mais barato</Text>
                  <Text style={styles.savingsValue}>economize {formatPrice(savings)}</Text>
                </View>
              )}

              {comparisons.length === 0 ? (
                <View style={styles.centered}>
                  <Text style={styles.emptyTitle}>Nada pra comparar ainda</Text>
                  <Text style={styles.emptyText}>
                    Escaneie o mesmo produto em dois mercados diferentes e a
                    comparação aparece aqui.
                  </Text>
                </View>
              ) : (
                comparisons.map((comparison) => (
                  <View key={comparison.item.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {comparison.item.productName}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteItem(comparison.item.id, comparison.item.productName)}
                        hitSlop={8}
                      >
                        <Text style={styles.deleteIcon}>🗑️</Text>
                      </TouchableOpacity>
                    </View>

                    {[...comparison.item.prices]
                      .sort((a, b) => a.price - b.price)
                      .map((price) => {
                        const isCheapest = price.price === comparison.cheapest.price;
                        return (
                          <View key={price.marketId} style={styles.row}>
                            <Text style={[styles.rowName, isCheapest && styles.rowNameCheapest]}>
                              {isCheapest ? '✅ ' : ''}{price.marketName}
                            </Text>
                            <Text style={[styles.rowPrice, isCheapest && styles.rowPriceCheapest]}>
                              {formatPrice(price.price)}
                            </Text>
                          </View>
                        );
                      })}

                    <Text style={styles.savingsLine}>
                      {comparison.cheapest.marketName} economiza{' '}
                      <Text style={styles.savingsLineValue}>{formatPrice(comparison.savings)}</Text>
                      {' '}vs {comparison.mostExpensive.marketName}
                    </Text>
                  </View>
                ))
              )}

              {/* Itens vistos em um mercado só — sem comparação possível ainda */}
              {singlePriceItems.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Só um preço registrado</Text>
                  <Text style={styles.cardHint}>Escaneie em outro mercado pra poder comparar.</Text>
                  {singlePriceItems.map((item) => {
                    const only = cheapestPrice(item);
                    return (
                      <View key={item.id} style={styles.row}>
                        <View style={styles.rowInfo}>
                          <Text style={styles.rowName} numberOfLines={2}>{item.productName}</Text>
                          <Text style={styles.rowCategory}>{only?.marketName}</Text>
                        </View>
                        <Text style={styles.rowPrice}>{only ? formatPrice(only.price) : '—'}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      <TouchableOpacity
        style={[styles.fab, { bottom: bottomInset + 24 }]}
        onPress={handleScan}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>📸  Escanear preço</Text>
      </TouchableOpacity>

      {/* Sempre fechável: sem mercado a aba continua utilizável (o botão de
          escanear simplesmente reabre este modal), e prender a pessoa aqui
          antes de ela ter cadastrado qualquer loja não teria saída. */}
      <MarketPickerModal visible={pickerVisible} onClose={() => setPickerVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  marketBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 15, backgroundColor: '#c9a876', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
  },
  marketBarText: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },
  marketBarAction: {
    color: '#fff', fontSize: 11, fontWeight: '700',
    opacity: 0.9, textDecorationLine: 'underline',
  },

  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 15, paddingVertical: 12 },
  tab: {
    flex: 1, paddingVertical: 9, borderRadius: 16, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabActive: { backgroundColor: '#e8dcc8' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#3a3a3a' },
  tabTextActive: { color: '#2a2a2a' },

  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 40, paddingVertical: 50, gap: 8,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#2a2a2a' },
  emptyText: { fontSize: 13, color: '#4a4a4a', textAlign: 'center', lineHeight: 19 },

  content: { flex: 1 },
  contentInner: { paddingHorizontal: 15, gap: 12 },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 2 },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 6, gap: 8,
  },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#2a2a2a' },
  cardMeta: { fontSize: 11, color: '#aaa' },
  cardHint: { fontSize: 11, color: '#aaa', fontStyle: 'italic', marginBottom: 6 },
  deleteIcon: { fontSize: 16 },

  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 9, borderTopWidth: 1, borderTopColor: '#f2f2f2', gap: 10,
  },
  rowInfo: { flex: 1 },
  rowName: { flex: 1, fontSize: 13, color: '#2a2a2a', fontWeight: '500' },
  rowNameCheapest: { fontWeight: '700', color: '#2e7d32' },
  rowCategory: { fontSize: 10, color: '#bbb', marginTop: 2 },
  rowRight: { alignItems: 'flex-end' },
  rowPrice: { fontSize: 14, fontWeight: '700', color: '#2a2a2a' },
  rowPriceCheapest: { color: '#2e7d32' },
  cheapestTag: { fontSize: 9, color: '#2e7d32', fontWeight: '600', marginTop: 2 },

  savingsCard: {
    backgroundColor: '#2e7d32', borderRadius: 14, padding: 16, alignItems: 'center', gap: 4,
  },
  savingsLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  savingsValue: { fontSize: 20, fontWeight: '700', color: '#fff' },
  savingsLine: {
    fontSize: 11, color: '#666', marginTop: 8, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: '#f2f2f2',
  },
  savingsLineValue: { fontWeight: '700', color: '#2e7d32' },

  fab: {
    position: 'absolute', alignSelf: 'center', backgroundColor: '#2a2a2a',
    paddingHorizontal: 26, paddingVertical: 16, borderRadius: 30,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

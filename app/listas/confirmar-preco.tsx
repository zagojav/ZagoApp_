import React, { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMarketSession } from '@/context/MarketSessionContext';
import { usePriceItems } from '@/hooks/usePriceItems';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { PERSON_PROFILES } from '@/constants/personProfiles';
import { findMatchingProduct, formatPrice, parsePriceInput } from '@/utils/priceParser';
import { PRICE_CATEGORIES, type PriceCategory } from '@/types/database';

/** Lê um param que pode chegar como string ou array (expo-router permite os dois). */
function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function parseJsonArray<T>(value: string): T[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ConfirmarPrecoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const { market } = useMarketSession();
  const { items, loading: itemsLoading, savePrice } = usePriceItems();
  const { activeProfileId } = useActiveProfile();

  const ocrPrice = firstParam(params.price as string | string[] | undefined);
  const rawText = firstParam(params.rawText as string | string[] | undefined);

  const priceCandidates = useMemo(
    () => parseJsonArray<number>(firstParam(params.priceCandidates as string | string[] | undefined)),
    [params.priceCandidates]
  );
  const nameCandidates = useMemo(
    () => parseJsonArray<string>(firstParam(params.nameCandidates as string | string[] | undefined)),
    [params.nameCandidates]
  );

  const [productName, setProductName] = useState(
    firstParam(params.productName as string | string[] | undefined)
  );
  const [priceText, setPriceText] = useState(ocrPrice ? ocrPrice.replace('.', ',') : '');
  const [category, setCategory] = useState<PriceCategory>('Outros');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  // Ligado quando a pessoa diz que NÃO é o produto parecido que encontramos.
  const [forceNew, setForceNew] = useState(false);

  const parsedPrice = parsePriceInput(priceText);

  // Avisa antes de salvar que o preço vai entrar num produto que já existe —
  // é o momento certo de discordar, não depois de sobrescrever.
  const match = useMemo(() => {
    if (forceNew || !productName.trim()) return null;
    return findMatchingProduct(productName, items);
  }, [forceNew, productName, items]);

  const existingPriceHere = useMemo(() => {
    if (!match || !market) return null;
    return match.item.prices.find((p) => p.marketId === market.marketId) ?? null;
  }, [match, market]);

  // Enquanto a lista não carregou, `items` está vazio e o match de produto
  // existente daria sempre "não achei" — salvar aí duplicaria um produto que
  // já existe. Poucos décimos de segundo, mas é o intervalo exato em que a
  // pessoa chega na tela.
  const canSave =
    Boolean(productName.trim()) && parsedPrice !== null && Boolean(market) && !itemsLoading;

  const handleSave = async (thenContinue: boolean) => {
    if (!canSave || !market || parsedPrice === null) {
      setError(
        !productName.trim()
          ? 'Escreve o nome do produto.'
          : parsedPrice === null
            ? 'Preço inválido. Use o formato 24,90.'
            : !market
              ? 'Escolha um mercado antes de salvar.'
              : 'Ainda carregando os preços salvos. Um segundo.'
      );
      return;
    }

    setSaving(true);
    setError(null);

    const personId = activeProfileId ?? 'guilherme';
    const personName = PERSON_PROFILES[personId]?.name ?? 'Família';

    try {
      await savePrice({
        productName: productName.trim(),
        category,
        price: parsedPrice,
        marketId: market.marketId,
        marketName: market.marketName,
        personId,
        personName,
        forceNew,
      });

      if (thenContinue) {
        router.back();
      } else {
        router.dismissTo('/listas/precos');
      }
    } catch {
      setError('Não consegui salvar. Confira a internet e tente de novo.');
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confere aí</Text>
        <View style={styles.backBtnSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} keyboardShouldPersistTaps="handled">
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            Isso é o que eu li da etiqueta — o OCR erra às vezes. Ajuste o que estiver
            errado antes de salvar.
          </Text>
        </View>

        {/* Mercado — já escolhido antes de escanear, não se edita aqui */}
        <View style={styles.marketBox}>
          <Text style={styles.marketLabel}>Mercado</Text>
          <Text style={styles.marketName}>📍 {market?.marketName ?? '—'}</Text>
        </View>

        {/* Nome */}
        <View style={styles.field}>
          <Text style={styles.label}>Nome do produto</Text>
          <TextInput
            style={styles.input}
            value={productName}
            onChangeText={(text) => {
              setProductName(text);
              setForceNew(false);
            }}
            placeholder="Ex: Arroz Tio João 5kg"
            placeholderTextColor="#bbb"
            autoCapitalize="words"
          />
          {nameCandidates.length > 1 && (
            <>
              <Text style={styles.hint}>Também li isso na etiqueta:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {nameCandidates
                  .filter((candidate) => candidate !== productName)
                  .map((candidate) => (
                    <TouchableOpacity
                      key={candidate}
                      style={styles.chip}
                      onPress={() => {
                        setProductName(candidate);
                        setForceNew(false);
                      }}
                    >
                      <Text style={styles.chipText} numberOfLines={1}>{candidate}</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </>
          )}
        </View>

        {/* Aviso de produto já existente */}
        {match && (
          <View style={styles.matchBox}>
            <Text style={styles.matchTitle}>
              Vou atualizar o preço de “{match.item.productName}”
            </Text>
            <Text style={styles.matchText}>
              {existingPriceHere
                ? `Nesse mercado ele estava ${formatPrice(existingPriceHere.price)}.`
                : 'Ele já existe na lista, mas ainda sem preço nesse mercado.'}
            </Text>
            <TouchableOpacity onPress={() => setForceNew(true)}>
              <Text style={styles.matchAction}>Não é esse — criar produto novo</Text>
            </TouchableOpacity>
          </View>
        )}

        {forceNew && (
          <View style={styles.matchBox}>
            <Text style={styles.matchText}>Vai entrar como produto novo.</Text>
            <TouchableOpacity onPress={() => setForceNew(false)}>
              <Text style={styles.matchAction}>Desfazer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Preço */}
        <View style={styles.field}>
          <Text style={styles.label}>Preço</Text>
          <TextInput
            style={[styles.input, styles.priceInput]}
            value={priceText}
            onChangeText={setPriceText}
            placeholder="24,90"
            placeholderTextColor="#bbb"
            keyboardType="decimal-pad"
            inputMode="decimal"
          />
          {parsedPrice !== null && (
            <Text style={styles.pricePreview}>{formatPrice(parsedPrice)}</Text>
          )}
          {priceCandidates.length > 1 && (
            <>
              <Text style={styles.hint}>Outros números que apareceram:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {priceCandidates
                  .filter((candidate) => candidate !== parsedPrice)
                  .map((candidate) => (
                    <TouchableOpacity
                      key={candidate}
                      style={styles.chip}
                      onPress={() => setPriceText(candidate.toFixed(2).replace('.', ','))}
                    >
                      <Text style={styles.chipText}>{formatPrice(candidate)}</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </>
          )}
        </View>

        {/* Categoria */}
        <View style={styles.field}>
          <Text style={styles.label}>Categoria</Text>
          <View style={styles.categoryGrid}>
            {PRICE_CATEGORIES.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.categoryChip, category === option && styles.categoryChipActive]}
                onPress={() => setCategory(option)}
              >
                <Text style={[styles.categoryChipText, category === option && styles.categoryChipTextActive]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Texto cru do OCR, pra quando o palpite sai muito errado */}
        {!!rawText && (
          <View style={styles.rawBox}>
            <TouchableOpacity onPress={() => setShowRaw((shown) => !shown)}>
              <Text style={styles.rawToggle}>
                {showRaw ? '▾ Esconder o que eu li' : '▸ Ver tudo que eu li na etiqueta'}
              </Text>
            </TouchableOpacity>
            {showRaw && <Text style={styles.rawText}>{rawText}</Text>}
          </View>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.primaryBtn, (!canSave || saving) && styles.btnDisabled]}
          onPress={() => handleSave(true)}
          disabled={!canSave || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.primaryBtnText}>
              {itemsLoading ? 'Carregando...' : 'Salvar e escanear o próximo'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={[styles.secondaryBtn, (!canSave || saving) && styles.btnDisabled]}
            onPress={() => handleSave(false)}
            disabled={!canSave || saving}
          >
            <Text style={styles.secondaryBtnText}>Salvar e finalizar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.discardBtn}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={styles.discardBtnText}>Descartar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#a89080' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 15, paddingBottom: 15,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 8, backgroundColor: '#d4c5b9',
    justifyContent: 'center', alignItems: 'center',
  },
  backBtnSpacer: { width: 40 },
  backIcon: { fontSize: 24, color: '#2a2a2a', fontWeight: 'bold' },
  headerTitle: { fontSize: 22, fontWeight: '300', fontStyle: 'italic', color: '#2a2a2a' },

  content: { flex: 1 },
  contentInner: { paddingHorizontal: 15, paddingBottom: 20, gap: 14 },

  noticeBox: { backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 10, padding: 12 },
  noticeText: { fontSize: 12, color: '#3a3a3a', lineHeight: 17 },

  marketBox: {
    backgroundColor: '#e8dcc8', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
  },
  marketLabel: { fontSize: 11, color: '#8a7a63', fontWeight: '600', textTransform: 'uppercase' },
  marketName: { fontSize: 16, fontWeight: '600', color: '#2a2a2a', marginTop: 2 },

  field: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#2a2a2a' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#2a2a2a',
  },
  priceInput: { fontSize: 20, fontWeight: '700' },
  pricePreview: { fontSize: 12, color: '#8a6d3b', fontWeight: '600' },
  hint: { fontSize: 11, color: '#999', marginTop: 2 },
  chipRow: { gap: 8, paddingVertical: 2 },
  chip: {
    backgroundColor: '#f3e9d7', borderRadius: 14, paddingHorizontal: 12,
    paddingVertical: 7, maxWidth: 220,
  },
  chipText: { fontSize: 12, color: '#8a6d3b', fontWeight: '600' },

  matchBox: {
    backgroundColor: '#fdf6e3', borderRadius: 12, padding: 14, gap: 4,
    borderLeftWidth: 4, borderLeftColor: '#c9a876',
  },
  matchTitle: { fontSize: 13, fontWeight: '700', color: '#2a2a2a' },
  matchText: { fontSize: 12, color: '#6a5a43', lineHeight: 17 },
  matchAction: {
    fontSize: 12, fontWeight: '700', color: '#8a6d3b',
    textDecorationLine: 'underline', marginTop: 6,
  },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  categoryChipActive: { backgroundColor: '#c9a876' },
  categoryChipText: { fontSize: 12, fontWeight: '500', color: '#2a2a2a' },
  categoryChipTextActive: { color: '#fff' },

  rawBox: { backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 10, padding: 12 },
  rawToggle: { fontSize: 12, fontWeight: '600', color: '#3a3a3a' },
  rawText: {
    fontSize: 11, color: '#4a4a4a', marginTop: 8, lineHeight: 16,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  error: {
    fontSize: 13, color: '#fff', backgroundColor: '#c0392b',
    borderRadius: 8, padding: 10, textAlign: 'center',
  },

  actions: {
    paddingHorizontal: 15, paddingTop: 12, gap: 10,
    backgroundColor: '#a89080', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)',
  },
  primaryBtn: {
    backgroundColor: '#c9a876', borderRadius: 12, paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryRow: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 2, backgroundColor: '#e8dcc8', borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  secondaryBtnText: { color: '#2a2a2a', fontSize: 14, fontWeight: '600' },
  discardBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.2)',
  },
  discardBtnText: { color: '#5a4a3a', fontSize: 14, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
});

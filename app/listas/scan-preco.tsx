import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMarketSession } from '@/context/MarketSessionContext';
import { MarketPickerModal } from '@/components/market/MarketPickerModal';
import { scanPriceLabel, OcrError } from '@/services/ocr';

/**
 * Largura pra qual a foto é reduzida antes de virar base64.
 *
 * 1600px mantém a fonte miúda da etiqueta legível pra Vision e derruba o
 * payload de ~4MB (foto crua) pra algumas centenas de KB — o que importa
 * porque a foto trafega inteira dentro da chamada da function.
 */
const OCR_IMAGE_WIDTH = 1600;

export default function ScanPrecoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // CameraView é class component: a ref é a própria instância, e é nela
  // que takePictureAsync mora.
  const cameraRef = useRef<CameraView>(null);

  const { market, loading: marketLoading } = useMarketSession();
  const [permission, requestPermission] = useCameraPermissions();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  // Remonta a CameraView ao voltar da confirmação: em iOS a preview às vezes
  // volta congelada depois que a tela sai de foco.
  const [cameraKey, setCameraKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setBusy(false);
      setError(null);
      setCameraKey((key) => key + 1);
      if (!marketLoading && !market) setPickerVisible(true);
    }, [market, marketLoading])
  );

  const handleCapture = async () => {
    if (busy || !cameraRef.current || !market) return;

    setBusy(true);
    setError(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      if (!photo?.uri) throw new OcrError('Não consegui capturar a foto. Tente de novo.');

      const rendered = await ImageManipulator.manipulate(photo.uri)
        .resize({ width: OCR_IMAGE_WIDTH })
        .renderAsync();
      const resized = await rendered.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.7,
        base64: true,
      });

      if (!resized.base64) throw new OcrError('Falha ao preparar a imagem.');

      const result = await scanPriceLabel(resized.base64);

      router.push({
        pathname: '/listas/confirmar-preco',
        params: {
          productName: result.productName,
          price: result.price === null ? '' : String(result.price),
          rawText: result.rawText,
          priceCandidates: JSON.stringify(result.priceCandidates.map((c) => c.value)),
          nameCandidates: JSON.stringify(result.nameCandidates.slice(0, 5)),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não consegui ler a etiqueta.');
      setBusy(false);
    }
  };

  // --- Permissão ---------------------------------------------------------
  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#c9a876" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.permissionTitle}>Preciso da câmera</Text>
        <Text style={styles.permissionText}>
          É com ela que eu leio a etiqueta de preço. A foto vai só pro serviço de leitura
          e não fica salva.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>Permitir câmera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkBtn} onPress={() => router.back()}>
          <Text style={styles.linkBtnText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        key={cameraKey}
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        autofocus="on"
        enableTorch={torch}
        animateShutter={false}
      />

      {/* Cabeçalho: mercado atual sempre visível + trocar a qualquer momento */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.iconBtnText}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.marketChip}
          onPress={() => setPickerVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.marketChipText} numberOfLines={1}>
            📍 {market?.marketName ?? 'Escolher mercado'}
          </Text>
          <Text style={styles.marketChipAction}>trocar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconBtn, torch && styles.iconBtnActive]}
          onPress={() => setTorch((on) => !on)}
          hitSlop={8}
        >
          <Text style={styles.iconBtnText}>{torch ? '🔦' : '💡'}</Text>
        </TouchableOpacity>
      </View>

      {/* Moldura de enquadramento */}
      <View style={styles.frameArea} pointerEvents="none">
        <View style={styles.frame} />
        <Text style={styles.frameHint}>Enquadre só a etiqueta, bem de perto</Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.shutter, busy && styles.shutterBusy]}
          onPress={handleCapture}
          disabled={busy || !market}
          activeOpacity={0.7}
        >
          {busy ? <ActivityIndicator color="#fff" size="large" /> : <View style={styles.shutterInner} />}
        </TouchableOpacity>

        <Text style={styles.footerHint}>
          {busy
            ? 'Lendo etiqueta...'
            : market
              ? 'O que eu ler vem pra você conferir antes de salvar'
              : 'Escolha um mercado ali em cima pra começar'}
        </Text>
      </View>

      {/* Sempre fechável: sem mercado a tela continua utilizável (o botão de
          escanear simplesmente reabre este modal), e prender a pessoa aqui
          antes de ela ter cadastrado qualquer loja não teria saída. */}
      <MarketPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: {
    flex: 1, backgroundColor: '#a89080', justifyContent: 'center',
    alignItems: 'center', paddingHorizontal: 30, gap: 12,
  },
  permissionTitle: { fontSize: 20, fontWeight: '600', color: '#2a2a2a' },
  permissionText: { fontSize: 14, color: '#4a4a4a', textAlign: 'center', lineHeight: 20 },
  primaryBtn: {
    backgroundColor: '#c9a876', paddingHorizontal: 30, paddingVertical: 14,
    borderRadius: 12, marginTop: 10,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  linkBtn: { paddingVertical: 8 },
  linkBtnText: { color: '#2a2a2a', fontSize: 14, textDecorationLine: 'underline' },

  header: {
    position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row',
    alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  iconBtnActive: { backgroundColor: '#c9a876' },
  iconBtnText: { fontSize: 18, color: '#fff', fontWeight: '600' },
  marketChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(201,168,118,0.9)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 9, gap: 8,
  },
  marketChipText: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },
  marketChipAction: {
    color: '#fff', fontSize: 11, fontWeight: '700', opacity: 0.85,
    textDecorationLine: 'underline',
  },

  frameArea: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  frame: {
    width: '78%', aspectRatio: 1.35, borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)', borderRadius: 16,
  },
  frameHint: {
    color: '#fff', fontSize: 13, fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4,
  },

  footer: {
    alignItems: 'center', gap: 14, paddingTop: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  errorBox: {
    backgroundColor: 'rgba(192,57,43,0.92)', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10, marginHorizontal: 20,
  },
  errorText: { color: '#fff', fontSize: 13, textAlign: 'center' },
  shutter: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center',
  },
  shutterBusy: { backgroundColor: 'rgba(201,168,118,0.9)', borderColor: '#c9a876' },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  footerHint: {
    color: '#fff', fontSize: 12, opacity: 0.85, textAlign: 'center',
    paddingHorizontal: 30, ...Platform.select({ web: { userSelect: 'none' } }),
  },
});

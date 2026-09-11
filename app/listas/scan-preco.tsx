import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMarketSession } from '@/context/MarketSessionContext';
import { MarketPickerModal } from '@/components/market/MarketPickerModal';
import { scanPriceLabel, warmUpOcr, OcrError, type OcrImageSource } from '@/services/ocr';
import { pickPhoto } from '@/utils/pickPhoto';

// O uso real do scanner é pela web (PWA na tela de início do iPhone). O
// caminho nativo continua aqui porque a CameraView já existia e ainda serve
// pra rodar no simulador/dispositivo em desenvolvimento.
const IS_WEB = Platform.OS === 'web';

export default function ScanPrecoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // CameraView é class component: a ref é a própria instância, e é nela
  // que takePictureAsync mora.
  const cameraRef = useRef<CameraView>(null);

  const { market, loading: marketLoading } = useMarketSession();
  const [permission, requestPermission] = useCameraPermissions();

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  // Remonta a CameraView ao voltar da confirmação: em iOS a preview às vezes
  // volta congelada depois que a tela sai de foco.
  const [cameraKey, setCameraKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setBusy(false);
      setProgress(0);
      setError(null);
      setPreviewUri(null);
      setCameraKey((key) => key + 1);
      if (!marketLoading && !market) setPickerVisible(true);
      // Baixa o modelo enquanto a pessoa ainda está enquadrando, não depois
      // de ela já ter tirado a foto.
      warmUpOcr();
    }, [market, marketLoading])
  );

  /** Lê a imagem e navega pra confirmação. Comum às duas plataformas. */
  const runOcr = async (source: OcrImageSource) => {
    const result = await scanPriceLabel(source, { onProgress: setProgress });

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
  };

  // --- Web: input de arquivo abrindo a câmera traseira --------------------
  const handleWebCapture = async () => {
    if (busy || !market) return;

    setError(null);
    const file = await pickPhoto();
    if (!file) return; // cancelou o seletor

    const objectUrl = URL.createObjectURL(file);
    setPreviewUri(objectUrl);
    setBusy(true);
    setProgress(0);

    try {
      await runOcr(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não consegui ler a etiqueta.');
      setBusy(false);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  // --- Nativo: CameraView -------------------------------------------------
  const handleNativeCapture = async () => {
    if (busy || !cameraRef.current || !market) return;

    setBusy(true);
    setProgress(0);
    setError(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) throw new OcrError('Não consegui capturar a foto. Tente de novo.');
      await runOcr(photo.uri);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não consegui ler a etiqueta.');
      setBusy(false);
    }
  };

  const marketHeader = (
    <View style={[styles.header, { paddingTop: insets.top + 10 }, IS_WEB && styles.headerWeb]}>
      <TouchableOpacity
        style={[styles.iconBtn, IS_WEB && styles.iconBtnWeb]}
        onPress={() => router.back()}
        hitSlop={8}
      >
        <Text style={[styles.iconBtnText, IS_WEB && styles.iconBtnTextWeb]}>←</Text>
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

      {IS_WEB ? (
        <View style={styles.iconBtnSpacer} />
      ) : (
        <TouchableOpacity
          style={[styles.iconBtn, torch && styles.iconBtnActive]}
          onPress={() => setTorch((on) => !on)}
          hitSlop={8}
        >
          <Text style={styles.iconBtnText}>{torch ? '🔦' : '💡'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const statusBlock = (
    <>
      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {busy && (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <Text style={[styles.progressLabel, !IS_WEB && styles.progressLabelDark]}>
            {progress > 0
              ? `Lendo etiqueta... ${Math.round(progress * 100)}%`
              : 'Preparando o leitor...'}
          </Text>
        </View>
      )}
    </>
  );

  // =========================================================================
  // Web — o caminho principal
  // =========================================================================
  if (IS_WEB) {
    return (
      <View style={styles.containerWeb}>
        {marketHeader}

        <View style={styles.webBody}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="contain" />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderEmoji}>🏷️</Text>
              <Text style={styles.placeholderTitle}>Fotografe a etiqueta</Text>
              <Text style={styles.placeholderText}>
                Enquadre só a etiqueta, bem de perto. O que eu ler vem pra você
                conferir antes de salvar.
              </Text>
            </View>
          )}

          {statusBlock}
        </View>

        <View style={[styles.webFooter, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={[styles.webShutter, (busy || !market) && styles.btnDisabled]}
            onPress={handleWebCapture}
            disabled={busy || !market}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.webShutterText}>
                📸  {previewUri ? 'Tirar outra foto' : 'Tirar foto da etiqueta'}
              </Text>
            )}
          </TouchableOpacity>

          {!market && (
            <Text style={styles.webHint}>Escolha um mercado ali em cima pra começar</Text>
          )}
        </View>

        <MarketPickerModal visible={pickerVisible} onClose={() => setPickerVisible(false)} />
      </View>
    );
  }

  // =========================================================================
  // Nativo
  // =========================================================================
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
          É com ela que eu leio a etiqueta de preço. A foto não sai do aparelho.
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

      {marketHeader}

      <View style={styles.frameArea} pointerEvents="none">
        <View style={styles.frame} />
        <Text style={styles.frameHint}>Enquadre só a etiqueta, bem de perto</Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        {statusBlock}

        <TouchableOpacity
          style={[styles.shutter, busy && styles.shutterBusy]}
          onPress={handleNativeCapture}
          disabled={busy || !market}
          activeOpacity={0.7}
        >
          {busy ? <ActivityIndicator color="#fff" size="large" /> : <View style={styles.shutterInner} />}
        </TouchableOpacity>

        <Text style={styles.footerHint}>
          {market
            ? 'O que eu ler vem pra você conferir antes de salvar'
            : 'Escolha um mercado ali em cima pra começar'}
        </Text>
      </View>

      <MarketPickerModal visible={pickerVisible} onClose={() => setPickerVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  containerWeb: { flex: 1, backgroundColor: '#a89080' },
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
    backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 2,
  },
  headerWeb: { position: 'relative', backgroundColor: 'transparent' },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  iconBtnWeb: { backgroundColor: '#d4c5b9' },
  iconBtnActive: { backgroundColor: '#c9a876' },
  iconBtnText: { fontSize: 18, color: '#fff', fontWeight: '600' },
  iconBtnTextWeb: { color: '#2a2a2a' },
  iconBtnSpacer: { width: 40 },
  marketChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(201,168,118,0.95)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 9, gap: 8,
  },
  marketChipText: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },
  marketChipAction: {
    color: '#fff', fontSize: 11, fontWeight: '700', opacity: 0.85,
    textDecorationLine: 'underline',
  },

  // --- web ---
  webBody: { flex: 1, padding: 15, gap: 14, justifyContent: 'center' },
  preview: { flex: 1, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.15)' },
  placeholder: {
    flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, borderRadius: 16, borderWidth: 2,
    borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.5)',
  },
  placeholderEmoji: { fontSize: 52 },
  placeholderTitle: { fontSize: 18, fontWeight: '700', color: '#2a2a2a' },
  placeholderText: { fontSize: 13, color: '#4a4a4a', textAlign: 'center', lineHeight: 19 },
  webFooter: { paddingHorizontal: 15, paddingTop: 10, gap: 10, alignItems: 'center' },
  webShutter: {
    width: '100%', backgroundColor: '#2a2a2a', borderRadius: 30,
    paddingVertical: 18, alignItems: 'center', justifyContent: 'center',
  },
  webShutterText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  webHint: { fontSize: 12, color: '#4a4a4a' },

  // --- progresso / erro ---
  progressWrap: { gap: 6, paddingHorizontal: 4 },
  progressTrack: {
    height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.15)',
  },
  progressFill: { height: '100%', backgroundColor: '#c9a876' },
  progressLabel: { fontSize: 12, fontWeight: '600', color: '#2a2a2a', textAlign: 'center' },
  progressLabelDark: { color: '#fff' },
  errorBox: {
    backgroundColor: 'rgba(192,57,43,0.95)', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  errorText: { color: '#fff', fontSize: 13, textAlign: 'center' },

  // --- nativo ---
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
    alignItems: 'stretch', gap: 14, paddingTop: 18, paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  shutter: {
    width: 76, height: 76, borderRadius: 38, alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 4, borderColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  shutterBusy: { backgroundColor: 'rgba(201,168,118,0.9)', borderColor: '#c9a876' },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  footerHint: { color: '#fff', fontSize: 12, opacity: 0.85, textAlign: 'center' },
  btnDisabled: { opacity: 0.5 },
});

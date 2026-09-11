import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Radius, Spacing } from '@/constants/design';

interface PinPadProps {
  length?: number;
  accentColor?: string;
  /** Cor dos dígitos. Precisa vir do perfil: o teclado aparece sobre fundos
   *  que vão do branco ao quase preto, e uma cor fixa some em metade deles. */
  textColor?: string;
  onComplete: (pin: string) => void;
  errorMessage?: string;
  disabled?: boolean;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export function PinPad({
  length = 4,
  accentColor = '#6f5947',
  textColor = '#2a2a2a',
  onComplete,
  errorMessage,
  disabled,
}: PinPadProps) {
  const [digits, setDigits] = useState('');

  useEffect(() => {
    if (digits.length === length) {
      onComplete(digits);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits, length]);

  const handlePress = (key: string) => {
    if (disabled) return;
    if (key === '⌫') {
      setDigits((prev) => prev.slice(0, -1));
      return;
    }
    if (key === '' || digits.length >= length) return;
    setDigits((prev) => prev + key);
  };

  return (
    <View style={styles.container}>
      <View style={styles.dotsRow}>
        {Array.from({ length }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { borderColor: accentColor },
              i < digits.length && { backgroundColor: accentColor },
            ]}
          />
        ))}
      </View>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : <View style={styles.errorSpacer} />}
      <View style={styles.keypad}>
        {KEYS.map((key, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.key, key === '' && styles.keyHidden]}
            onPress={() => handlePress(key)}
            disabled={key === '' || disabled}
            activeOpacity={0.55}
          >
            <Text style={[styles.keyText, { color: textColor }]}>{key}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: '100%' },
  dotsRow: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.md },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  error: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textAlign: 'center',
    height: 18,
    lineHeight: 18,
  },
  errorSpacer: { height: 18, marginBottom: Spacing.md },
  /** 3 colunas de 76 = 228; largura fixa mantém as teclas em grade perfeita. */
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 228, marginTop: Spacing.sm },
  key: {
    width: 76,
    height: 62,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyHidden: { opacity: 0 },
  keyText: { fontSize: 25, fontWeight: '500' },
});

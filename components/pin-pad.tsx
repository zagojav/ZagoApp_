import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PinPadProps {
  length?: number;
  accentColor?: string;
  onComplete: (pin: string) => void;
  errorMessage?: string;
  disabled?: boolean;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export function PinPad({ length = 4, accentColor = '#6f5947', onComplete, errorMessage, disabled }: PinPadProps) {
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
            activeOpacity={0.6}
          >
            <Text style={styles.keyText}>{key}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: '100%' },
  dotsRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  error: { color: '#e53935', fontSize: 13, fontWeight: '600', marginBottom: 12, textAlign: 'center', height: 18 },
  errorSpacer: { height: 18, marginBottom: 12 },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 260, justifyContent: 'center', marginTop: 10 },
  key: { width: 78, height: 64, justifyContent: 'center', alignItems: 'center' },
  keyHidden: { opacity: 0 },
  keyText: { fontSize: 26, fontWeight: '600', color: '#2a2a2a' },
});

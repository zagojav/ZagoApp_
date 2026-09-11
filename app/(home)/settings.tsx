import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { hashPin } from '@/utils/pin';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { useFamily } from '@/hooks/useFamily';
import { PinPad } from '@/components/pin-pad';
import { DrawerMenuButton } from '@/components/drawer-menu-button';
import { PERSON_PROFILES } from '@/constants/personProfiles';
import { PROFILE_THEMES } from '@/constants/profileTheme';
import { Casa, Radius, Spacing, shadow } from '@/constants/design';

type Step = 'current' | 'new' | 'confirm' | 'done';

export default function SettingsScreen() {
  const { activeProfileId } = useActiveProfile();
  const { members, loading } = useFamily();
  const [step, setStep] = useState<Step>('current');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);

  const profile = activeProfileId ? PERSON_PROFILES[activeProfileId] : null;
  const member = members.find((m) => m.id === activeProfileId);

  const goHome = () => router.replace('/(home)/inicio');

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: Casa.page }]}>
        <DrawerMenuButton />
        <ActivityIndicator size="large" color={Casa.accent} />
      </View>
    );
  }

  const theme = PROFILE_THEMES[profile.id];

  const handleCurrentPin = async (value: string) => {
    if (!member) return;
    const hash = await hashPin(value);
    if (hash === member.pinHash) {
      setError('');
      setStep('new');
      setAttempt((a) => a + 1);
    } else {
      setError('PIN atual incorreto.');
      setAttempt((a) => a + 1);
    }
  };

  const handleNewPin = (value: string) => {
    setNewPin(value);
    setError('');
    setStep('confirm');
    setAttempt((a) => a + 1);
  };

  const handleConfirmPin = async (value: string) => {
    if (value !== newPin) {
      setError('Os PINs não coincidem. Vamos tentar de novo.');
      setNewPin('');
      setStep('new');
      setAttempt((a) => a + 1);
      return;
    }
    if (!activeProfileId) return;
    setSaving(true);
    try {
      const pinHash = await hashPin(value);
      await updateDoc(doc(db, 'users', activeProfileId), {
        pinHash,
        updatedAt: serverTimestamp(),
      });
      setStep('done');
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
      setNewPin('');
      setStep('new');
    } finally {
      setSaving(false);
    }
  };

  /** Passo 1 de 3, 2 de 3... — deixa claro onde a pessoa está no fluxo. */
  const stepIndex = step === 'current' ? 0 : step === 'new' ? 1 : 2;

  return (
    <View style={[styles.container, { backgroundColor: theme.page }]}>
      <DrawerMenuButton />
      <Text style={[styles.title, { color: theme.onPage }]}>Configurações</Text>
      <Text style={[styles.subtitle, { color: theme.textOnPage }]}>
        Alterar PIN de {profile.name}
      </Text>

      {step !== 'done' && (
        <View style={styles.stepper}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                { backgroundColor: i <= stepIndex ? theme.fill : theme.track },
                i === stepIndex && styles.stepDotCurrent,
              ]}
            />
          ))}
        </View>
      )}

      {step === 'current' && (
        <>
          <Text style={[styles.stepLabel, { color: theme.onPage }]}>Digite seu PIN atual</Text>
          <PinPad key={attempt} accentColor={theme.fill} textColor={theme.onPage} onComplete={handleCurrentPin} errorMessage={error} disabled={loading} />
        </>
      )}

      {step === 'new' && (
        <>
          <Text style={[styles.stepLabel, { color: theme.onPage }]}>Digite o novo PIN</Text>
          <PinPad key={attempt} accentColor={theme.fill} textColor={theme.onPage} onComplete={handleNewPin} errorMessage={error} />
        </>
      )}

      {step === 'confirm' && (
        <>
          <Text style={[styles.stepLabel, { color: theme.onPage }]}>Confirme o novo PIN</Text>
          {saving ? (
            <View style={styles.padPlaceholder}>
              <ActivityIndicator size="large" color={theme.fill} />
            </View>
          ) : (
            <PinPad key={attempt} accentColor={theme.fill} textColor={theme.onPage} onComplete={handleConfirmPin} errorMessage={error} />
          )}
        </>
      )}

      {step === 'done' && (
        <>
          <Text style={[styles.doneIcon]}>✅</Text>
          <Text style={[styles.stepLabel, { color: theme.onPage }]}>PIN atualizado com sucesso!</Text>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: theme.accent }]}
            onPress={goHome}
            activeOpacity={0.85}
          >
            <Text style={[styles.doneBtnText, { color: theme.onAccent }]}>Voltar para a Página Inicial</Text>
          </TouchableOpacity>
        </>
      )}

      {step !== 'done' && (
        <TouchableOpacity style={styles.cancelLink} onPress={goHome} activeOpacity={0.7}>
          <Text style={[styles.cancelLinkText, { color: theme.textOnPage }]}>Cancelar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xxl },
  title: { fontSize: 24, fontWeight: '700', marginBottom: Spacing.xs, letterSpacing: 0.3 },
  subtitle: { fontSize: 13, marginBottom: Spacing.lg, textAlign: 'center', fontWeight: '500' },
  stepper: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  stepDot: { width: 20, height: 4, borderRadius: 2 },
  stepDotCurrent: { width: 28 },
  stepLabel: { fontSize: 14, marginBottom: Spacing.lg, textAlign: 'center', fontWeight: '600' },
  padPlaceholder: { height: 282, justifyContent: 'center', alignItems: 'center' },
  doneIcon: { fontSize: 44, lineHeight: 52, marginBottom: Spacing.sm },
  doneBtn: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radius.md,
    ...shadow(1),
  },
  doneBtnText: { fontWeight: '700', fontSize: 15 },
  cancelLink: { marginTop: Spacing.xl, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  cancelLinkText: { fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
});

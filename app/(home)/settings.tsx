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
      <View style={styles.container}>
        <DrawerMenuButton />
        <ActivityIndicator size="large" color="#6f5947" />
      </View>
    );
  }

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

  return (
    <View style={[styles.container, { backgroundColor: profile.colors.primary }]}>
      <DrawerMenuButton />
      <Text style={[styles.title, { color: profile.colors.secondary }]}>Configurações</Text>
      <Text style={[styles.subtitle, { color: profile.colors.secondary }]}>
        Alterar PIN de {profile.name}
      </Text>

      {step === 'current' && (
        <>
          <Text style={[styles.stepLabel, { color: profile.colors.secondary }]}>Digite seu PIN atual</Text>
          <PinPad key={attempt} accentColor={profile.colors.accent} onComplete={handleCurrentPin} errorMessage={error} disabled={loading} />
        </>
      )}

      {step === 'new' && (
        <>
          <Text style={[styles.stepLabel, { color: profile.colors.secondary }]}>Digite o novo PIN</Text>
          <PinPad key={attempt} accentColor={profile.colors.accent} onComplete={handleNewPin} errorMessage={error} />
        </>
      )}

      {step === 'confirm' && (
        <>
          <Text style={[styles.stepLabel, { color: profile.colors.secondary }]}>Confirme o novo PIN</Text>
          {saving ? (
            <ActivityIndicator size="large" color={profile.colors.secondary} style={{ marginTop: 24 }} />
          ) : (
            <PinPad key={attempt} accentColor={profile.colors.accent} onComplete={handleConfirmPin} errorMessage={error} />
          )}
        </>
      )}

      {step === 'done' && (
        <>
          <Text style={[styles.stepLabel, { color: profile.colors.secondary }]}>PIN atualizado com sucesso!</Text>
          <TouchableOpacity style={[styles.doneBtn, { backgroundColor: profile.colors.accent }]} onPress={goHome}>
            <Text style={styles.doneBtnText}>Voltar para a Página Inicial</Text>
          </TouchableOpacity>
        </>
      )}

      {step !== 'done' && (
        <TouchableOpacity style={styles.cancelLink} onPress={goHome}>
          <Text style={[styles.cancelLinkText, { color: profile.colors.secondary }]}>Cancelar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 24, textAlign: 'center' },
  stepLabel: { fontSize: 14, marginBottom: 16, textAlign: 'center' },
  doneBtn: { marginTop: 16, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 10 },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelLink: { marginTop: 20 },
  cancelLinkText: { fontSize: 13, textDecorationLine: 'underline' },
});

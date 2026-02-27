import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { salvar, carregar } from '../utils/storage';

const people = [
  { id: 1, name: 'Amanda', slug: 'amanda' },
  { id: 2, name: 'Guilherme', slug: 'guilherme' },
  { id: 3, name: 'Renata', slug: 'renata' },
  { id: 4, name: 'Vander', slug: 'vander' },
];

type Aposta = {
  id: number;
  campeonato: string;
  timeCasa: string;
  timeFora: string;
  golCasa: string;
  golFora: string;
  data: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [novaAposta, setNovaAposta] = useState({
    campeonato: '',
    timeCasa: '',
    timeFora: '',
    golCasa: '',
    golFora: '',
  });

  // Carregar apostas ao abrir a tela
  useEffect(() => {
    carregar<Aposta[]>('apostas').then(dados => {
      if (dados) setApostas(dados);
    });
  }, []);

  // Salvar apostas sempre que mudarem
  useEffect(() => {
    salvar('apostas', apostas);
  }, [apostas]);

  const handleNavigatePerson = (slug: string) => {
    router.push(`/pessoal/${slug}`);
  };

  const handleNavigate = (screen: string) => {
    setMenuOpen(false);
    router.push(screen);
  };

  const limparNovaAposta = () => {
    setNovaAposta({ campeonato: '', timeCasa: '', timeFora: '', golCasa: '', golFora: '' });
  };

  const handleCriarAposta = () => {
    if (!novaAposta.campeonato || !novaAposta.timeCasa || !novaAposta.timeFora || !novaAposta.golCasa || !novaAposta.golFora) return;
    const nova: Aposta = {
      id: Date.now(),
      campeonato: novaAposta.campeonato,
      timeCasa: novaAposta.timeCasa,
      timeFora: novaAposta.timeFora,
      golCasa: novaAposta.golCasa,
      golFora: novaAposta.golFora,
      data: new Date().toLocaleDateString('pt-BR'),
    };
    setApostas(prev => [nova, ...prev]);
    limparNovaAposta();
    setShowModal(false);
  };

  const handleFinalizarAposta = (id: number) => {
    setApostas(prev => prev.filter(a => a.id !== id));
  };

  const botaoCriarDesabilitado =
    !novaAposta.campeonato || !novaAposta.timeCasa || !novaAposta.timeFora || !novaAposta.golCasa || !novaAposta.golFora;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Página Inicial</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Quem sou eu?</Text>
        {people.map(person => (
          <View key={person.id} style={styles.personCard}>
            <Text style={styles.personName}>{person.name}</Text>
            <TouchableOpacity style={styles.enterBtn} onPress={() => handleNavigatePerson(person.slug)} activeOpacity={0.8}>
              <Text style={styles.enterText}>Entrar</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.apostasSection}>
          <View style={styles.apostasHeader}>
            <Text style={styles.apostasTitle}>Apostas Legalizadas dos Zagos ({apostas.length})</Text>
            <TouchableOpacity style={styles.addBetBtn} onPress={() => setShowModal(true)} activeOpacity={0.8}>
              <Text style={styles.addBetText}>+ NOVA APOSTA</Text>
            </TouchableOpacity>
          </View>

          {apostas.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Nenhuma aposta ainda...</Text>
              <Text style={styles.emptySubText}>Toque em "+ NOVA APOSTA" para começar</Text>
            </View>
          )}

          {apostas.map(aposta => (
            <View key={aposta.id} style={styles.apostaCard}>
              <View style={styles.apostaHeader}>
                <Text style={styles.campeonato}>{aposta.campeonato}</Text>
                <Text style={styles.data}>{aposta.data}</Text>
              </View>
              <View style={styles.timesRow}>
                <Text style={styles.timeNome}>{aposta.timeCasa}</Text>
                <View style={styles.placar}>
                  <Text style={styles.placarNumero}>{aposta.golCasa}</Text>
                  <Text style={styles.placarX}>X</Text>
                  <Text style={styles.placarNumero}>{aposta.golFora}</Text>
                </View>
                <Text style={styles.timeNome}>{aposta.timeFora}</Text>
              </View>
              <TouchableOpacity style={styles.finishBtn} onPress={() => handleFinalizarAposta(aposta.id)}>
                <Text style={styles.finishText}>JOGO FINALIZADO</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {menuOpen && (
        <TouchableOpacity style={styles.overlay} onPress={() => setMenuOpen(false)} activeOpacity={1}>
          <View style={styles.menu}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setMenuOpen(false)}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('/listas')}>
              <Text style={styles.menuText}>Listas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('/pets')}>
              <Text style={styles.menuText}>Pets</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('/afazeres')}>
              <Text style={styles.menuText}>Afazeres de casa</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      <Modal visible={showModal} transparent animationType="fade">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nova Aposta</Text>
            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Campeonato</Text>
              <TextInput style={styles.input} placeholderTextColor="#d4c5b9" value={novaAposta.campeonato} onChangeText={text => setNovaAposta(prev => ({ ...prev, campeonato: text }))} />
              <Text style={styles.label}>Time da casa</Text>
              <TextInput style={styles.input} placeholderTextColor="#d4c5b9" value={novaAposta.timeCasa} onChangeText={text => setNovaAposta(prev => ({ ...prev, timeCasa: text }))} />
              <Text style={styles.label}>Time visitante</Text>
              <TextInput style={styles.input} placeholderTextColor="#d4c5b9" value={novaAposta.timeFora} onChangeText={text => setNovaAposta(prev => ({ ...prev, timeFora: text }))} />
              <Text style={styles.label}>Placar</Text>
              <View style={styles.placarInputsRow}>
                <TextInput style={[styles.scoreInput, { marginRight: 8 }]} placeholder="0" placeholderTextColor="#d4c5b9" keyboardType="numeric" maxLength={2} value={novaAposta.golCasa} onChangeText={text => setNovaAposta(prev => ({ ...prev, golCasa: text.replace(/[^0-9]/g, '') }))} />
                <Text style={styles.placarXModal}>X</Text>
                <TextInput style={[styles.scoreInput, { marginLeft: 8 }]} placeholder="0" placeholderTextColor="#d4c5b9" keyboardType="numeric" maxLength={2} value={novaAposta.golFora} onChangeText={text => setNovaAposta(prev => ({ ...prev, golFora: text.replace(/[^0-9]/g, '') }))} />
              </View>
              <TouchableOpacity style={[styles.saveBtn, botaoCriarDesabilitado && styles.saveBtnDisabled]} onPress={handleCriarAposta} disabled={botaoCriarDesabilitado}>
                <Text style={styles.saveText}>CRIAR APOSTA</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { limparNovaAposta(); setShowModal(false); }}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#a89080' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#a89080' },
  menuBtn: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#d4c5b9', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuIcon: { fontSize: 24, color: '#2a2a2a', fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#2a2a2a' },
  content: { paddingHorizontal: 20, paddingVertical: 30, paddingBottom: 40 },
  heading: { fontSize: 32, fontWeight: '300', fontStyle: 'italic', color: '#2a2a2a', marginBottom: 30 },
  personCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(212, 197, 185, 0.5)', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 12, marginBottom: 15 },
  personName: { fontSize: 16, fontWeight: '400', color: '#2a2a2a' },
  enterBtn: { backgroundColor: '#e8dcc8', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
  enterText: { fontSize: 14, fontWeight: '400', fontStyle: 'italic', color: '#2a2a2a' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  menu: { position: 'absolute', top: 0, left: 0, width: '65%', height: '100%', backgroundColor: '#6f5947', paddingTop: 20 },
  closeBtn: { paddingHorizontal: 20, paddingVertical: 10 },
  closeIcon: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
  menuItem: { paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.2)' },
  menuText: { fontSize: 16, color: '#fff', fontWeight: '500' },
  apostasSection: { marginTop: 40 },
  apostasHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  apostasTitle: { fontSize: 20, fontWeight: '700', color: '#2a2a2a' },
  addBetBtn: { backgroundColor: '#5d4037', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBetText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  emptyBox: { padding: 20, borderRadius: 12, backgroundColor: 'rgba(212, 197, 185, 0.4)', alignItems: 'center' },
  emptyText: { color: '#2a2a2a', fontSize: 16, fontWeight: '600' },
  emptySubText: { color: '#5a4a40', fontSize: 13, marginTop: 4 },
  apostaCard: { backgroundColor: '#6f5947', borderRadius: 16, padding: 16, marginTop: 12 },
  apostaHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  campeonato: { color: '#e8dcc8', fontWeight: '700', fontSize: 14 },
  data: { color: '#d4c5b9', fontSize: 12 },
  timesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  timeNome: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  placar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4e342e', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 40 },
  placarNumero: { color: '#fff', fontSize: 18, fontWeight: '800', marginHorizontal: 4 },
  placarX: { color: '#d4c5b9', fontSize: 16, fontWeight: '800' },
  finishBtn: { marginTop: 4, backgroundColor: '#4e342e', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  finishText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '90%', maxHeight: '85%', backgroundColor: '#6f5947', borderRadius: 20, paddingTop: 16, paddingBottom: 10 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 10 },
  modalContent: { paddingHorizontal: 20, paddingBottom: 20 },
  label: { color: '#e8dcc8', fontWeight: '600', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: 'rgba(212,197,185,0.3)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', borderWidth: 1, borderColor: 'rgba(212,197,185,0.6)' },
  placarInputsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 6, marginBottom: 14 },
  scoreInput: { width: 60, height: 60, borderRadius: 30, textAlign: 'center', backgroundColor: 'rgba(212,197,185,0.3)', color: '#fff', fontSize: 22, fontWeight: '800', borderWidth: 1, borderColor: 'rgba(212,197,185,0.6)' },
  placarXModal: { color: '#e8dcc8', fontSize: 22, fontWeight: '800', marginHorizontal: 6 },
  saveBtn: { backgroundColor: '#5d4037', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  saveBtnDisabled: { backgroundColor: 'rgba(93,64,55,0.4)' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cancelBtn: { marginTop: 10, alignItems: 'center' },
  cancelText: { color: '#e8dcc8', fontSize: 14, fontWeight: '600' },
});

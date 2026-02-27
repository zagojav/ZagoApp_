import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function IndexScreen() {
  const router = useRouter();

  const handleIniciar = () => {
    router.push('./home');
  };

  return (
    <View style={styles.container}>
      {/* Título */}
      <Text style={styles.title}>Zago's</Text>
      <Text style={styles.subtitle}>App</Text>

      {/* Descrição */}
      <Text style={styles.description}>
        Aplicativo para facilitar nosso dia a dia em casa
      </Text>

      {/* Botão Iniciar */}
      <TouchableOpacity 
        style={styles.button}
        onPress={handleIniciar}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Iniciar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#a89080',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 56,
    fontWeight: '300',
    fontStyle: 'italic',
    color: '#2a2a2a',
    marginBottom: 5,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 48,
    fontWeight: '300',
    fontStyle: 'italic',
    color: '#2a2a2a',
    marginBottom: 40,
  },
  description: {
    fontSize: 14,
    color: '#4a4a4a',
    textAlign: 'center',
    marginBottom: 60,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#e8dcc8',
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 30,
  },
  buttonText: {
    color: '#2a2a2a',
    fontSize: 16,
    fontWeight: '500',
  },
});

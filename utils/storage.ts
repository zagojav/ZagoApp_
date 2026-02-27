import AsyncStorage from '@react-native-async-storage/async-storage';

export async function salvar(chave: string, dados: any): Promise<void> {
  try {
    await AsyncStorage.setItem(chave, JSON.stringify(dados));
  } catch (e) {
    console.error(`Erro ao salvar "${chave}":`, e);
  }
}

export async function carregar<T>(chave: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(chave);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (e) {
    console.error(`Erro ao carregar "${chave}":`, e);
    return null;
  }
}

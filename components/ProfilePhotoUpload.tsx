import { useState } from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { uploadToCloudinary } from '@/services/cloudinary';
import type { PersonId } from '@/types/database';

interface ProfilePhotoUploadProps {
  visible: boolean;
  userId: PersonId;
  currentPhotoUrl?: string | null;
  fallbackImage: number;
  profileColor: string;
  onPhotoSelected: (url: string) => void;
  onClose: () => void;
}

export function ProfilePhotoUpload({
  visible,
  userId,
  currentPhotoUrl,
  fallbackImage,
  profileColor,
  onPhotoSelected,
  onClose,
}: ProfilePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const pickAndUploadImage = async () => {
    setError('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Precisamos de acesso às suas fotos para continuar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(result.assets[0].uri);
      await updateDoc(doc(db, 'users', userId), {
        photoUrl: url,
        updatedAt: serverTimestamp(),
      });
      onPhotoSelected(url);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar a foto.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Foto de Perfil</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <Image
            source={currentPhotoUrl ? { uri: currentPhotoUrl } : fallbackImage}
            style={styles.preview}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: profileColor }]}
            onPress={pickAndUploadImage}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>📸 Escolher Foto</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  content: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#2a2a2a' },
  close: { fontSize: 22, color: '#999' },
  preview: { width: 120, height: 120, borderRadius: 60, marginBottom: 20 },
  error: { color: '#e53935', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  button: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 10, minWidth: 200, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

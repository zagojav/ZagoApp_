import { useCallback, useEffect, useState } from 'react';
import { collection, doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import type { Pet, PetNote } from '@/types/database';

interface UsePetsResult {
  pets: Pet[];
  loading: boolean;
  saveNotes: (petId: string, notes: PetNote[]) => Promise<void>;
}

// Shared/family data — every profile reads and writes the same 5 pet docs
// (seeded by ensurePetsSeeded), kept in real time via onSnapshot.
export function usePets(): UsePetsResult {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'pets'),
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Pet));
        setPets(items);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao escutar pets:', error);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const saveNotes = useCallback(async (petId: string, notes: PetNote[]) => {
    await updateDoc(doc(db, 'pets', petId), { notes, updatedAt: serverTimestamp() });
  }, []);

  return { pets, loading, saveNotes };
}

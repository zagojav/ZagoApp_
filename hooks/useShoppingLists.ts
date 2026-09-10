import { useCallback, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';

interface UseShoppingListResult<T> {
  items: T[];
  loading: boolean;
  saveItems: (items: T[]) => Promise<void>;
}

// One document per list (e.g. 'mercado', 'farmacia') holding an `items`
// array field, shared/real-time across every profile via onSnapshot.
// setDoc(..., { merge: true }) creates the document on first save, so no
// separate seeding step is needed.
export function useShoppingList<T extends { id: string }>(listId: string): UseShoppingListResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, 'shopping_lists', listId);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data();
        setItems((data?.items as T[]) ?? []);
        setLoading(false);
      },
      (error) => {
        console.error(`Erro ao escutar shopping_lists/${listId}:`, error);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [listId]);

  const saveItems = useCallback(
    async (nextItems: T[]) => {
      const ref = doc(db, 'shopping_lists', listId);
      await setDoc(ref, { items: nextItems, updatedAt: serverTimestamp() }, { merge: true });
    },
    [listId]
  );

  return { items, loading, saveItems };
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { FAMILY_ID } from '@/constants/personProfiles';
import type { PersonId, Reminder } from '@/types/database';

interface UseRemindersResult {
  /** Lembretes ainda em aberto. */
  reminders: Reminder[];
  /** Lembretes já concluídos — continuam acessíveis para desfazer. */
  completed: Reminder[];
  loading: boolean;
  addReminder: (subject: string, date: string) => Promise<void>;
  updateReminder: (id: string, subject: string, date: string) => Promise<void>;
  completeReminder: (id: string) => Promise<void>;
  uncompleteReminder: (id: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
}

// Private per-profile data on a shared anonymous Firebase session: privacy
// here is organizational (this hook only ever queries the active profile's
// own userId), not cryptographic — same model already used for
// sharedActivities. See firestore.rules.
//
// A query NÃO filtra mais por `completed == false`. Ela filtrava, e o
// resultado era que tocar no "✓" fazia o lembrete sumir da tela na hora,
// sem confirmação, sem desfazer e sem nenhum lugar para reencontrá-lo — o
// dado continuava no Firestore, mas para quem usava o app ele tinha
// simplesmente desaparecido. Agora vêm os dois grupos e a tela mostra os
// concluídos numa seção própria, com opção de reabrir.
export function useReminders(userId: PersonId | null): UseRemindersResult {
  const [all, setAll] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setAll([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'reminders'), where('userId', '==', userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(
          (docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Reminder
        );
        setAll(items);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao escutar reminders:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  const reminders = useMemo(() => all.filter((r) => !r.completed), [all]);
  const completed = useMemo(() => all.filter((r) => r.completed), [all]);

  const addReminder = useCallback(
    async (subject: string, date: string) => {
      if (!userId) return;
      await addDoc(collection(db, 'reminders'), {
        familyId: FAMILY_ID,
        userId,
        subject,
        date,
        completed: false,
        createdAt: serverTimestamp(),
        completedAt: null,
      });
    },
    [userId]
  );

  const updateReminder = useCallback(async (id: string, subject: string, date: string) => {
    await updateDoc(doc(db, 'reminders', id), { subject, date });
  }, []);

  const completeReminder = useCallback(async (id: string) => {
    await updateDoc(doc(db, 'reminders', id), { completed: true, completedAt: serverTimestamp() });
  }, []);

  const uncompleteReminder = useCallback(async (id: string) => {
    await updateDoc(doc(db, 'reminders', id), { completed: false, completedAt: null });
  }, []);

  const deleteReminder = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'reminders', id));
  }, []);

  return {
    reminders,
    completed,
    loading,
    addReminder,
    updateReminder,
    completeReminder,
    uncompleteReminder,
    deleteReminder,
  };
}

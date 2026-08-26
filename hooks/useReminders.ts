import { useCallback, useEffect, useState } from 'react';
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
import type { PersonId, Reminder } from '@/types/database';

interface UseRemindersResult {
  reminders: Reminder[];
  loading: boolean;
  addReminder: (subject: string, date: string) => Promise<void>;
  updateReminder: (id: string, subject: string, date: string) => Promise<void>;
  completeReminder: (id: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
}

// Private per-profile data on a shared anonymous Firebase session: privacy
// here is organizational (this hook only ever queries the active profile's
// own userId), not cryptographic — same model already used for
// sharedActivities. See firestore.rules.
export function useReminders(userId: PersonId | null): UseRemindersResult {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setReminders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'reminders'),
      where('userId', '==', userId),
      where('completed', '==', false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Reminder));
        setReminders(items);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao escutar reminders:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  const addReminder = useCallback(
    async (subject: string, date: string) => {
      if (!userId) return;
      await addDoc(collection(db, 'reminders'), {
        familyId: 'casa-zago',
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

  const deleteReminder = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'reminders', id));
  }, []);

  return { reminders, loading, addReminder, updateReminder, completeReminder, deleteReminder };
}

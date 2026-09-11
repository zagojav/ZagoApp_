import { useCallback, useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { FAMILY_ID } from '@/constants/personProfiles';
import type { PersonId } from '@/types/database';

/**
 * "Minhas Tarefas" da tela pessoal.
 *
 * ANTES ISSO NÃO EXISTIA. A lista vivia num `useState` dentro da tela, sem
 * nenhuma persistência: fechar o app, recarregar a página ou até trocar de
 * aba desmontava o componente e apagava tudo. Não era um bug intermitente —
 * perdia 100% das vezes, toda vez.
 *
 * Agora mora no Firestore, igual aos lembretes.
 */

export interface PersonalTask {
  id: string;
  familyId: string;
  userId: PersonId;
  title: string;
  completed: boolean;
  createdAt: Timestamp | null;
  completedAt: Timestamp | null;
}

interface UsePersonalTasksResult {
  tasks: PersonalTask[];
  loading: boolean;
  addTask: (title: string) => Promise<void>;
  renameTask: (id: string, title: string) => Promise<void>;
  toggleTask: (task: PersonalTask) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

function createdAtMillis(task: PersonalTask): number {
  // serverTimestamp() chega null no snapshot local até o servidor confirmar.
  return task.createdAt?.toMillis?.() ?? Number.MAX_SAFE_INTEGER;
}

export function usePersonalTasks(userId: PersonId | null): UsePersonalTasksResult {
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Só filtra por dono e ordena no cliente — assim não precisa de índice
    // composto no Firestore, que falharia silenciosamente em produção.
    const q = query(collection(db, 'personal_tasks'), where('userId', '==', userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(
          (docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as PersonalTask
        );
        items.sort((a, b) => createdAtMillis(a) - createdAtMillis(b));
        setTasks(items);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao escutar personal_tasks:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  const addTask = useCallback(
    async (title: string) => {
      if (!userId) return;
      await addDoc(collection(db, 'personal_tasks'), {
        familyId: FAMILY_ID,
        userId,
        title,
        completed: false,
        createdAt: serverTimestamp(),
        completedAt: null,
      });
    },
    [userId]
  );

  const renameTask = useCallback(async (id: string, title: string) => {
    await updateDoc(doc(db, 'personal_tasks', id), { title });
  }, []);

  const toggleTask = useCallback(async (task: PersonalTask) => {
    const next = !task.completed;
    await updateDoc(doc(db, 'personal_tasks', task.id), {
      completed: next,
      completedAt: next ? serverTimestamp() : null,
    });
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'personal_tasks', id));
  }, []);

  return { tasks, loading, addTask, renameTask, toggleTask, deleteTask };
}

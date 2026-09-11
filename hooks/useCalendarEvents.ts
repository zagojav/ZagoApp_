import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { FAMILY_ID } from '@/constants/personProfiles';
import { carregar, salvar } from '@/utils/storage';
import type { PersonId } from '@/types/database';

/**
 * Eventos do calendário pessoal.
 *
 * DOIS PROBLEMAS SÉRIOS FORAM CORRIGIDOS AQUI:
 *
 * 1. Corrida que apagava os eventos. A tela tinha dois efeitos:
 *
 *        useEffect(() => { carregar(chave).then(setEvents) }, []);
 *        useEffect(() => { salvar(chave, events) }, [events]);
 *
 *    Na montagem, `events` é `[]`, então o SEGUNDO efeito rodava
 *    imediatamente e gravava `[]` por cima do que estava salvo — antes de
 *    o `carregar` ter respondido. Se a pessoa fechasse o app nessa janela,
 *    ou se o carregamento falhasse, os eventos iam embora de vez.
 *
 * 2. Os eventos só existiam NAQUELE aparelho. AsyncStorage no navegador é
 *    localStorage: não sincroniza, não tem backup, e some se limpar os
 *    dados do site. Agora ficam no Firestore, como o resto do app.
 *
 * A migração do que está no aparelho roda uma vez, é idempotente (o id do
 * documento vem do id antigo) e NÃO apaga o AsyncStorage — ele fica como
 * backup local.
 */

export interface CalendarEvent {
  id: string;
  familyId: string;
  userId: PersonId;
  /** 'DD/MM/YYYY' — mesmo formato que as telas já usam. */
  date: string;
  title: string;
  description: string;
  time: string;
  createdAt: Timestamp | null;
}

interface LegacyEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  time: string;
}

export interface CalendarEventInput {
  date: string;
  title: string;
  description: string;
  time: string;
}

interface UseCalendarEventsResult {
  events: CalendarEvent[];
  loading: boolean;
  addEvent: (input: CalendarEventInput) => Promise<void>;
  updateEvent: (id: string, input: Omit<CalendarEventInput, 'date'>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

const legacyKey = (userId: PersonId) => `calendario_${userId}`;
const migratedKey = (userId: PersonId) => `calendario_${userId}_migrado`;

export function useCalendarEvents(userId: PersonId): UseCalendarEventsResult {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const migrationAttempted = useRef<string | null>(null);

  // --- Migração do AsyncStorage (uma vez por perfil, por sessão) ---------
  useEffect(() => {
    if (migrationAttempted.current === userId) return;
    migrationAttempted.current = userId;

    (async () => {
      try {
        const alreadyMigrated = await carregar<boolean>(migratedKey(userId));
        if (alreadyMigrated) return;

        const legacy = (await carregar<LegacyEvent[]>(legacyKey(userId))) ?? [];
        if (legacy.length > 0) {
          const batch = writeBatch(db);
          for (const event of legacy) {
            if (!event?.id) continue;
            // Id determinístico: dois aparelhos migrando ao mesmo tempo
            // escrevem exatamente o mesmo documento, sem duplicar.
            batch.set(doc(db, 'calendar_events', `${userId}_${event.id}`), {
              familyId: FAMILY_ID,
              userId,
              date: event.date ?? '',
              title: event.title ?? '',
              description: event.description ?? '',
              time: event.time ?? '',
              createdAt: serverTimestamp(),
            });
          }
          await batch.commit();
        }

        // Só marca como migrado depois do commit dar certo. Se falhar, a
        // próxima abertura tenta de novo com os mesmos ids.
        await salvar(migratedKey(userId), true);
      } catch (error) {
        console.error(`Falha ao migrar calendário de ${userId}:`, error);
      }
    })();
  }, [userId]);

  // --- Escuta em tempo real ---------------------------------------------
  useEffect(() => {
    setLoading(true);
    // Filtra só por dono e ordena no cliente — sem índice composto.
    const q = query(collection(db, 'calendar_events'), where('userId', '==', userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setEvents(
          snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as CalendarEvent)
        );
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao escutar calendar_events:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  const addEvent = useCallback(
    async (input: CalendarEventInput) => {
      const ref = doc(collection(db, 'calendar_events'));
      await setDoc(ref, {
        familyId: FAMILY_ID,
        userId,
        date: input.date,
        title: input.title,
        description: input.description,
        time: input.time,
        createdAt: serverTimestamp(),
      });
    },
    [userId]
  );

  const updateEvent = useCallback(async (id: string, input: Omit<CalendarEventInput, 'date'>) => {
    await updateDoc(doc(db, 'calendar_events', id), {
      title: input.title,
      description: input.description,
      time: input.time,
    });
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'calendar_events', id));
  }, []);

  return { events, loading, addEvent, updateEvent, deleteEvent };
}

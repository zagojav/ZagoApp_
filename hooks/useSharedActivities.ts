import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  deleteField,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { addDays, formatDateKey, getTodayKey, parseDateKey, startOfDay, toStorageKey } from '@/utils/dates';
import type { ActivityCompletion, ActivityFrequency, PersonId, SharedActivity } from '@/types/database';

export interface NewActivityInput {
  title: string;
  description: string;
  assignedTo: PersonId | null;
  frequency: ActivityFrequency;
  daysOfWeek: number[];
  date: string | null;
  createdBy: PersonId;
  createdByName: string;
}

interface UseSharedActivitiesResult {
  activities: SharedActivity[];
  loading: boolean;
  addActivity: (input: NewActivityInput) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  toggleCompletion: (activity: SharedActivity, dateKey: string, personId: PersonId, personName: string) => Promise<void>;
}

export function useSharedActivities(): UseSharedActivitiesResult {
  const [activities, setActivities] = useState<SharedActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'sharedActivities'), (snapshot) => {
      const list = snapshot.docs.map((docSnap) => normalizeActivity(docSnap.id, docSnap.data()));
      setActivities(list);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const addActivity = useCallback(async (input: NewActivityInput) => {
    await addDoc(collection(db, 'sharedActivities'), {
      familyId: 'casa-zago',
      createdBy: input.createdBy,
      createdByName: input.createdByName,
      title: input.title,
      description: input.description,
      assignedTo: input.assignedTo,
      frequency: input.frequency,
      daysOfWeek: input.daysOfWeek,
      date: input.date,
      completions: {},
      createdAt: serverTimestamp(),
    });
  }, []);

  const deleteActivity = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'sharedActivities', id));
  }, []);

  const toggleCompletion = useCallback(
    async (activity: SharedActivity, dateKey: string, personId: PersonId, personName: string) => {
      const storageKey = toStorageKey(dateKey);
      const isCompleted = Boolean(activity.completions?.[storageKey]);
      if (isCompleted) {
        await updateDoc(doc(db, 'sharedActivities', activity.id), {
          [`completions.${storageKey}`]: deleteField(),
        });
      } else {
        await updateDoc(doc(db, 'sharedActivities', activity.id), {
          [`completions.${storageKey}`]: {
            completedBy: personId,
            completedByName: personName,
            completedAt: serverTimestamp(),
          },
        });
      }
    },
    []
  );

  return { activities, loading, addActivity, deleteActivity, toggleCompletion };
}

// Defends against documents written before a schema change, or edited by
// hand in the Firestore console, that are missing fields the rest of this
// module assumes are always present.
function normalizeActivity(id: string, data: Record<string, unknown>): SharedActivity {
  return {
    id,
    familyId: typeof data.familyId === 'string' ? data.familyId : 'casa-zago',
    createdBy: data.createdBy as PersonId,
    createdByName: typeof data.createdByName === 'string' ? data.createdByName : '',
    title: typeof data.title === 'string' ? data.title : '',
    description: typeof data.description === 'string' ? data.description : '',
    assignedTo: (data.assignedTo as PersonId | null) ?? null,
    frequency: (data.frequency as ActivityFrequency) ?? 'once',
    daysOfWeek: Array.isArray(data.daysOfWeek) ? (data.daysOfWeek as number[]) : [],
    date: typeof data.date === 'string' ? data.date : null,
    completions: (data.completions && typeof data.completions === 'object' ? data.completions : {}) as SharedActivity['completions'],
    createdAt: data.createdAt as SharedActivity['createdAt'],
  } as SharedActivity;
}

export function isActivityOnDate(activity: SharedActivity, date: Date): boolean {
  if (activity.frequency === 'once') {
    return activity.date === formatDateKey(date);
  }
  if (activity.frequency === 'daily') {
    return true;
  }
  return (activity.daysOfWeek ?? []).includes(date.getDay());
}

export function isCompletedOnDate(activity: SharedActivity, dateKey: string): boolean {
  return Boolean(activity.completions?.[toStorageKey(dateKey)]);
}

export function getActivitiesForPerson(activities: SharedActivity[], personId: PersonId): SharedActivity[] {
  return activities.filter((a) => a.assignedTo === personId);
}

// The occurrence a checkbox toggle in a list view (not a calendar day) should
// affect: 'once' tasks always refer to their own fixed date; recurring tasks
// refer to today's occurrence.
export function relevantDateKeyForToday(activity: SharedActivity): string {
  if (activity.frequency === 'once') return activity.date ?? '';
  return getTodayKey();
}

export interface ActivityOccurrence {
  dateKey: string; // 'DD/MM/YYYY'
  date: Date;
  status: 'completed' | 'missed' | 'pending';
  completion: ActivityCompletion | null;
}

// Expected occurrences for a recurring activity within a day window around
// today, each resolved against `completions` to say whether it was done,
// missed (date already passed with nothing recorded), or still pending.
export function getOccurrenceHistory(
  activity: SharedActivity,
  window: { past: number; future: number } = { past: 21, future: 7 }
): ActivityOccurrence[] {
  const today = startOfDay(new Date());

  if (activity.frequency === 'once') {
    if (!activity.date) return [];
    const date = parseDateKey(activity.date);
    const completion = activity.completions?.[toStorageKey(activity.date)] ?? null;
    const status: ActivityOccurrence['status'] = completion ? 'completed' : date < today ? 'missed' : 'pending';
    return [{ dateKey: activity.date, date, status, completion }];
  }

  const occurrences: ActivityOccurrence[] = [];
  for (let offset = -window.past; offset <= window.future; offset++) {
    const date = addDays(today, offset);
    const matches = activity.frequency === 'daily' || (activity.daysOfWeek ?? []).includes(date.getDay());
    if (!matches) continue;
    const dateKey = formatDateKey(date);
    const completion = activity.completions?.[toStorageKey(dateKey)] ?? null;
    const status: ActivityOccurrence['status'] = completion ? 'completed' : offset < 0 ? 'missed' : 'pending';
    occurrences.push({ dateKey, date, status, completion });
  }
  return occurrences;
}

export interface OverdueActivity {
  activity: SharedActivity;
  missedDates: string[]; // 'DD/MM/YYYY', oldest first
}

// Tasks a person created (for someone else) that have at least one missed
// occurrence in the recent past — what the creator's "who's slacking" view
// and Home banner are both built from.
export function getOverdueForCreator(
  activities: SharedActivity[],
  creatorId: PersonId,
  lookbackDays = 14
): OverdueActivity[] {
  return activities
    .filter((a) => a.createdBy === creatorId && a.assignedTo !== creatorId && a.frequency !== 'once')
    .map((activity) => ({
      activity,
      missedDates: getOccurrenceHistory(activity, { past: lookbackDays, future: 0 })
        .filter((o) => o.status === 'missed')
        .map((o) => o.dateKey),
    }))
    .filter((info) => info.missedDates.length > 0);
}

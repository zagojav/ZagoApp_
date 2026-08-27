import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { PERSON_ORDER, PERSON_PROFILES } from '@/constants/personProfiles';
import type { FamilyUser, PersonId } from '@/types/database';

export interface FamilyMember extends FamilyUser {
  colors: (typeof PERSON_PROFILES)[PersonId]['colors'];
  image: number;
}

interface UseFamilyResult {
  members: FamilyMember[];
  loading: boolean;
  error: Error | null;
}

export function useFamily(): UseFamilyResult {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const byId = new Map<string, FamilyUser>();
        snapshot.forEach((docSnap) => {
          byId.set(docSnap.id, { id: docSnap.id, ...docSnap.data() } as FamilyUser);
        });

        const merged = PERSON_ORDER.filter((id) => byId.has(id)).map((id) => {
          const user = byId.get(id)!;
          const profile = PERSON_PROFILES[id];
          return { ...user, colors: profile.colors, image: profile.image };
        });

        setMembers(merged);
        setLoading(false);
      },
      (err) => {
        console.error('Erro ao escutar users:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  return { members, loading, error };
}

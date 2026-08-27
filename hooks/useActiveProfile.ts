import { useCallback, useEffect, useState } from 'react';
import { salvar, carregar } from '@/utils/storage';
import { withTimeout } from '@/utils/withTimeout';
import type { PersonId } from '@/types/database';

const ACTIVE_PROFILE_KEY = 'activeProfileId';

interface UseActiveProfileResult {
  activeProfileId: PersonId | null;
  loading: boolean;
  setActiveProfile: (id: PersonId) => Promise<void>;
  clearActiveProfile: () => Promise<void>;
}

export function useActiveProfile(): UseActiveProfileResult {
  const [activeProfileId, setActiveProfileId] = useState<PersonId | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    withTimeout(carregar<PersonId>(ACTIVE_PROFILE_KEY), 10000)
      .then((id) => setActiveProfileId(id))
      .catch(() => setActiveProfileId(null))
      .finally(() => setLoading(false));
  }, []);

  const setActiveProfile = useCallback(async (id: PersonId) => {
    await salvar(ACTIVE_PROFILE_KEY, id);
    setActiveProfileId(id);
  }, []);

  const clearActiveProfile = useCallback(async () => {
    await salvar(ACTIVE_PROFILE_KEY, null);
    setActiveProfileId(null);
  }, []);

  return { activeProfileId, loading, setActiveProfile, clearActiveProfile };
}

import { useCallback, useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { FAMILY_ID } from '@/constants/personProfiles';
import { normalizeProductName } from '@/utils/priceParser';
import type { Market } from '@/types/database';

interface UseMarketsResult {
  markets: Market[];
  loading: boolean;
  /** Devolve o mercado criado (ou o já existente com o mesmo nome). */
  addMarket: (name: string, location: string) => Promise<Market>;
  deleteMarket: (id: string) => Promise<void>;
}

export function useMarkets(): UseMarketsResult {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'markets'), (snapshot) => {
      const list = snapshot.docs
        .map((docSnap) => normalizeMarket(docSnap.id, docSnap.data()))
        .filter((market) => market.familyId === FAMILY_ID)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

      setMarkets(list);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const addMarket = useCallback(
    async (name: string, location: string): Promise<Market> => {
      const trimmedName = name.trim();
      const trimmedLocation = location.trim();

      // Sem isso, "São Vicente" e "sao vicente" viram dois mercados e a
      // comparação de preço fica dividida entre os dois.
      const existing = markets.find(
        (market) => normalizeProductName(market.name) === normalizeProductName(trimmedName)
      );
      if (existing) return existing;

      const payload = {
        familyId: FAMILY_ID,
        name: trimmedName,
        location: trimmedLocation,
        createdAt: serverTimestamp(),
      };
      const created = await addDoc(collection(db, 'markets'), payload);

      return { id: created.id, ...payload } as Market;
    },
    [markets]
  );

  const deleteMarket = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'markets', id));
  }, []);

  return { markets, loading, addMarket, deleteMarket };
}

function normalizeMarket(id: string, data: Record<string, unknown>): Market {
  return {
    id,
    familyId: typeof data.familyId === 'string' ? data.familyId : FAMILY_ID,
    name: typeof data.name === 'string' ? data.name : '',
    location: typeof data.location === 'string' ? data.location : '',
    createdAt: data.createdAt as Market['createdAt'],
  };
}

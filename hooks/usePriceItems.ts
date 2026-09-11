import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { FAMILY_ID } from '@/constants/personProfiles';
import { findMatchingProduct, normalizeProductName } from '@/utils/priceParser';
import type { MarketPrice, PersonId, PriceCategory, PriceItem } from '@/types/database';

export interface SavePriceInput {
  productName: string;
  category: PriceCategory;
  price: number;
  marketId: string;
  marketName: string;
  personId: PersonId;
  personName: string;
  /**
   * Força criar item novo mesmo que exista um parecido — usado quando a tela
   * de confirmação avisa "vai atualizar X" e a pessoa discorda.
   */
  forceNew?: boolean;
}

export interface SavePriceResult {
  itemId: string;
  productName: string;
  /** 'created' = produto novo; 'updated' = preço entrou num item que já existia. */
  action: 'created' | 'updated';
  /** Preço anterior nesse mesmo mercado, quando havia um. */
  previousPrice: number | null;
}

interface UsePriceItemsResult {
  items: PriceItem[];
  loading: boolean;
  savePrice: (input: SavePriceInput) => Promise<SavePriceResult>;
  deleteItem: (id: string) => Promise<void>;
  removeMarketPrice: (itemId: string, marketId: string) => Promise<void>;
}

export function usePriceItems(): UsePriceItemsResult {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'priceItems'), (snapshot) => {
      const list = snapshot.docs
        .map((docSnap) => normalizePriceItem(docSnap.id, docSnap.data()))
        .filter((item) => item.familyId === FAMILY_ID)
        .sort((a, b) => a.productName.localeCompare(b.productName, 'pt-BR'));

      setItems(list);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const savePrice = useCallback(
    async (input: SavePriceInput): Promise<SavePriceResult> => {
      const productName = input.productName.trim();

      // Timestamp.now() e não serverTimestamp(): o sentinel do servidor só
      // funciona num caminho de campo, não dentro de elemento de array — o
      // Firestore rejeita a escrita. Dentro de `prices` o horário é o do
      // celular; no `updatedAt` do documento continua sendo o do servidor.
      const now = Timestamp.now();
      const entry: MarketPrice = {
        marketId: input.marketId,
        marketName: input.marketName,
        price: input.price,
        updatedAt: now,
        updatedBy: input.personId,
        updatedByName: input.personName,
      };

      const match = input.forceNew ? null : findMatchingProduct(productName, items);

      if (match) {
        const existing = match.item;
        const previous = existing.prices.find((p) => p.marketId === input.marketId) ?? null;

        // Um preço por mercado: reescanear o mesmo produto na mesma loja
        // corrige o valor em vez de empilhar histórico.
        const prices = [
          ...existing.prices.filter((p) => p.marketId !== input.marketId),
          entry,
        ];

        await updateDoc(doc(db, 'priceItems', existing.id), {
          prices,
          category: input.category,
          updatedAt: serverTimestamp(),
        });

        return {
          itemId: existing.id,
          productName: existing.productName,
          action: 'updated',
          previousPrice: previous?.price ?? null,
        };
      }

      const created = await addDoc(collection(db, 'priceItems'), {
        familyId: FAMILY_ID,
        productName,
        normalizedName: normalizeProductName(productName),
        category: input.category,
        prices: [entry],
        createdBy: input.personId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { itemId: created.id, productName, action: 'created', previousPrice: null };
    },
    [items]
  );

  const deleteItem = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'priceItems', id));
  }, []);

  const removeMarketPrice = useCallback(
    async (itemId: string, marketId: string) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const prices = item.prices.filter((p) => p.marketId !== marketId);

      // Item sem nenhum preço não tem o que mostrar em lugar nenhum.
      if (prices.length === 0) {
        await deleteDoc(doc(db, 'priceItems', itemId));
        return;
      }

      await updateDoc(doc(db, 'priceItems', itemId), { prices, updatedAt: serverTimestamp() });
    },
    [items]
  );

  return { items, loading, savePrice, deleteItem, removeMarketPrice };
}

function normalizePriceItem(id: string, data: Record<string, unknown>): PriceItem {
  const productName = typeof data.productName === 'string' ? data.productName : '';
  const rawPrices = Array.isArray(data.prices) ? data.prices : [];

  return {
    id,
    familyId: typeof data.familyId === 'string' ? data.familyId : FAMILY_ID,
    productName,
    normalizedName:
      typeof data.normalizedName === 'string' ? data.normalizedName : normalizeProductName(productName),
    category: (data.category as PriceCategory) ?? 'Outros',
    // Descarta entrada sem preço numérico: uma só quebraria todo cálculo de
    // "mais barato" com NaN.
    prices: rawPrices.filter(
      (price): price is MarketPrice =>
        typeof price === 'object' &&
        price !== null &&
        typeof (price as MarketPrice).price === 'number' &&
        Number.isFinite((price as MarketPrice).price) &&
        typeof (price as MarketPrice).marketId === 'string'
    ),
    createdBy: data.createdBy as PersonId,
    createdAt: data.createdAt as PriceItem['createdAt'],
    updatedAt: data.updatedAt as PriceItem['updatedAt'],
  };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import type { PersonId, ShoppingAisle, ShoppingCategory, ShoppingItem, ShoppingUnit } from '@/types/database';

/**
 * Lista de compras com UM DOCUMENTO POR ITEM.
 *
 * O formato antigo guardava a lista inteira num array dentro de um único
 * documento, e cada mudança reescrevia o array todo. Duas pessoas marcando
 * itens ao mesmo tempo no mercado se sobrescreviam — a última escrita
 * ganhava e o trabalho da outra sumia. Aqui cada escrita toca só o próprio
 * item, então isso não acontece mais.
 *
 * A migração do formato antigo roda sozinha na primeira abertura, é
 * idempotente (os ids dos documentos vêm dos ids antigos, então dois
 * aparelhos migrando ao mesmo tempo escrevem exatamente a mesma coisa) e
 * NÃO apaga o array antigo — ele fica no documento pai como backup.
 */

interface LegacyItem {
  id: string;
  name?: string;
  quantity?: string;
  category?: string;
  collected?: boolean;
}

export interface NewShoppingItem {
  product: string;
  quantity: number;
  unit: ShoppingUnit;
  category: ShoppingCategory;
  aisle: ShoppingAisle;
  gtin: string | null;
  brand: string | null;
}

interface UseShoppingItemsResult {
  items: ShoppingItem[];
  loading: boolean;
  addItem: (input: NewShoppingItem, person: PersonId, personName: string) => Promise<void>;
  updateItem: (id: string, patch: Partial<NewShoppingItem>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  toggleCollected: (item: ShoppingItem, person: PersonId, personName: string) => Promise<void>;
  setTargetMarket: (id: string, market: string | null) => Promise<void>;
  clearCollected: (ids: string[]) => Promise<void>;
}

const UNIT_ALIASES: Record<string, ShoppingUnit> = {
  kg: 'kg',
  quilo: 'kg',
  quilos: 'kg',
  g: 'g',
  grama: 'g',
  gramas: 'g',
  l: 'L',
  litro: 'L',
  litros: 'L',
  ml: 'ml',
  un: 'un',
  und: 'un',
  unid: 'un',
  unidade: 'un',
  unidades: 'un',
  pacote: 'pacote',
  pacotes: 'pacote',
  caixa: 'caixa',
  caixas: 'caixa',
};

/**
 * Converte a quantidade do formato antigo (texto livre, tipo '2kg' ou
 * 'meia dúzia') para número + unidade. O que não dá para interpretar vai
 * inteiro para `quantityNote` em vez de virar um número inventado.
 */
export function parseLegacyQuantity(raw: string | undefined): {
  quantity: number;
  unit: ShoppingUnit;
  quantityNote: string | null;
} {
  const text = (raw ?? '').trim();
  if (!text) return { quantity: 1, unit: 'un', quantityNote: null };

  const match = text.match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-ZçÇãÃáÁéÉêÊíÍóÓôÔõÕúÚ]+)?\s*(.*)$/);
  if (!match) return { quantity: 1, unit: 'un', quantityNote: text };

  const parsed = Number(match[1].replace(',', '.'));
  const quantity = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;

  const token = match[2]?.toLowerCase();
  const unit = (token && UNIT_ALIASES[token]) || 'un';

  // Sobrou texto depois do número e da unidade ('2 pacotes grandes'), ou o
  // token não era uma unidade conhecida ('3 sacos') — nos dois casos o
  // original fica visível em vez de ser descartado.
  const leftover = [token && !UNIT_ALIASES[token] ? token : '', match[3]].filter(Boolean).join(' ').trim();

  return { quantity, unit, quantityNote: leftover || null };
}

function toShoppingItem(id: string, data: Record<string, unknown>): ShoppingItem {
  return {
    id,
    product: (data.product as string) ?? '',
    quantity: (data.quantity as number) ?? 1,
    unit: (data.unit as ShoppingUnit) ?? 'un',
    quantityNote: (data.quantityNote as string | null) ?? null,
    category: (data.category as ShoppingCategory) ?? 'Compra da semana',
    aisle: (data.aisle as ShoppingAisle) ?? 'Outros',
    gtin: (data.gtin as string | null) ?? null,
    brand: (data.brand as string | null) ?? null,
    targetMarket: (data.targetMarket as string | null) ?? null,
    collected: (data.collected as boolean) ?? false,
    collectedBy: (data.collectedBy as PersonId | null) ?? null,
    collectedByName: (data.collectedByName as string | null) ?? null,
    collectedAt: (data.collectedAt as Timestamp | null) ?? null,
    addedBy: (data.addedBy as PersonId) ?? null,
    addedByName: (data.addedByName as string) ?? '',
    createdAt: (data.createdAt as Timestamp) ?? Timestamp.now(),
  };
}

function createdAtMillis(item: ShoppingItem): number {
  // serverTimestamp() chega null no snapshot local antes do servidor
  // confirmar; nesse intervalo o item vai para o fim da lista.
  return item.createdAt?.toMillis?.() ?? Number.MAX_SAFE_INTEGER;
}

export function useShoppingItems(listId: string): UseShoppingItemsResult {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const migrationAttempted = useRef(false);

  const itemsRef = useCallback(() => collection(db, 'shopping_lists', listId, 'items'), [listId]);

  // --- Migração do formato antigo (roda no máximo uma vez por sessão) ----
  useEffect(() => {
    migrationAttempted.current = false;
  }, [listId]);

  useEffect(() => {
    if (migrationAttempted.current) return;
    migrationAttempted.current = true;

    (async () => {
      try {
        const parentRef = doc(db, 'shopping_lists', listId);
        const snap = await getDoc(parentRef);
        const data = snap.data();
        if (!data || data.migratedAt) return;

        const legacy = (data.items as LegacyItem[] | undefined) ?? [];
        if (legacy.length === 0) {
          // Nada para migrar, mas marca assim mesmo para não reabrir o
          // documento pai a cada montagem da tela.
          await setDoc(parentRef, { migratedAt: serverTimestamp() }, { merge: true });
          return;
        }

        const batch = writeBatch(db);
        for (const item of legacy) {
          if (!item?.id) continue;
          const { quantity, unit, quantityNote } = parseLegacyQuantity(item.quantity);
          batch.set(doc(db, 'shopping_lists', listId, 'items', item.id), {
            // As regras do Firestore recusam produto vazio; um item antigo
            // sem nome entra com um rótulo visível em vez de ser descartado
            // silenciosamente (e derrubar o lote inteiro junto).
            product: item.name?.trim() || '(sem nome)',
            quantity,
            unit,
            quantityNote,
            category: (item.category as ShoppingCategory) ?? 'Compra da semana',
            aisle: 'Outros' as ShoppingAisle,
            gtin: null,
            brand: null,
            targetMarket: null,
            collected: item.collected ?? false,
            collectedBy: null,
            collectedByName: null,
            collectedAt: null,
            // Quem adicionou não existia no formato antigo.
            addedBy: null,
            addedByName: '',
            createdAt: serverTimestamp(),
          });
        }
        // O array antigo fica onde está, de propósito: se algo der errado
        // na conversão, o dado original continua no documento pai.
        batch.set(parentRef, { migratedAt: serverTimestamp() }, { merge: true });
        await batch.commit();
      } catch (error) {
        console.error(`Falha ao migrar shopping_lists/${listId}:`, error);
      }
    })();
  }, [listId]);

  // --- Escuta em tempo real ---------------------------------------------
  useEffect(() => {
    const unsubscribe = onSnapshot(
      itemsRef(),
      (snap) => {
        const next = snap.docs.map((d) => toShoppingItem(d.id, d.data()));
        next.sort((a, b) => createdAtMillis(a) - createdAtMillis(b));
        setItems(next);
        setLoading(false);
      },
      (error) => {
        console.error(`Erro ao escutar shopping_lists/${listId}/items:`, error);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [listId, itemsRef]);

  // --- Mutações ----------------------------------------------------------
  const addItem = useCallback(
    async (input: NewShoppingItem, person: PersonId, personName: string) => {
      const ref = doc(itemsRef());
      await setDoc(ref, {
        ...input,
        quantityNote: null,
        targetMarket: null,
        collected: false,
        collectedBy: null,
        collectedByName: null,
        collectedAt: null,
        addedBy: person,
        addedByName: personName,
        createdAt: serverTimestamp(),
      });
    },
    [itemsRef]
  );

  const updateItem = useCallback(
    async (id: string, patch: Partial<NewShoppingItem>) => {
      await updateDoc(doc(db, 'shopping_lists', listId, 'items', id), patch);
    },
    [listId]
  );

  const removeItem = useCallback(
    async (id: string) => {
      await deleteDoc(doc(db, 'shopping_lists', listId, 'items', id));
    },
    [listId]
  );

  const toggleCollected = useCallback(
    async (item: ShoppingItem, person: PersonId, personName: string) => {
      const next = !item.collected;
      await updateDoc(doc(db, 'shopping_lists', listId, 'items', item.id), {
        collected: next,
        collectedBy: next ? person : null,
        collectedByName: next ? personName : null,
        collectedAt: next ? serverTimestamp() : null,
      });
    },
    [listId]
  );

  const setTargetMarket = useCallback(
    async (id: string, market: string | null) => {
      await updateDoc(doc(db, 'shopping_lists', listId, 'items', id), { targetMarket: market });
    },
    [listId]
  );

  const clearCollected = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      const batch = writeBatch(db);
      for (const id of ids) {
        batch.update(doc(db, 'shopping_lists', listId, 'items', id), {
          collected: false,
          collectedBy: null,
          collectedByName: null,
          collectedAt: null,
        });
      }
      await batch.commit();
    },
    [listId]
  );

  return { items, loading, addItem, updateItem, removeItem, toggleCollected, setTargetMarket, clearCollected };
}

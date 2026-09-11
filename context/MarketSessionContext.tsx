import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { salvar, carregar } from '@/utils/storage';

const MARKET_SESSION_KEY = 'mercadoAtual';

export interface MarketSession {
  marketId: string;
  marketName: string;
}

interface MarketSessionContextValue {
  market: MarketSession | null;
  /** true enquanto o AsyncStorage não respondeu — evita piscar o modal à toa. */
  loading: boolean;
  setMarket: (market: MarketSession) => Promise<void>;
  clearMarket: () => Promise<void>;
}

const MarketSessionContext = createContext<MarketSessionContextValue | null>(null);

/**
 * Guarda em qual mercado a pessoa está AGORA.
 *
 * Persiste em AsyncStorage de propósito: a compra é longa, o app pode ser
 * fechado no meio (ou o celular travar na fila do caixa) e obrigar a
 * reselecionar a loja a cada volta mataria o loop rápido de escanear.
 */
export function MarketSessionProvider({ children }: { children: React.ReactNode }) {
  const [market, setMarketState] = useState<MarketSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregar<MarketSession>(MARKET_SESSION_KEY).then((stored) => {
      // Descarta registro pela metade (versão antiga do app, edição manual).
      if (stored?.marketId && stored?.marketName) setMarketState(stored);
      setLoading(false);
    });
  }, []);

  const setMarket = useCallback(async (next: MarketSession) => {
    setMarketState(next);
    await salvar(MARKET_SESSION_KEY, next);
  }, []);

  const clearMarket = useCallback(async () => {
    setMarketState(null);
    await salvar(MARKET_SESSION_KEY, null);
  }, []);

  const value = useMemo(
    () => ({ market, loading, setMarket, clearMarket }),
    [market, loading, setMarket, clearMarket]
  );

  return <MarketSessionContext.Provider value={value}>{children}</MarketSessionContext.Provider>;
}

export function useMarketSession(): MarketSessionContextValue {
  const context = useContext(MarketSessionContext);
  if (!context) {
    throw new Error('useMarketSession precisa estar dentro de <MarketSessionProvider>.');
  }
  return context;
}

'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface Ctx { ids: number[]; has: (id: number) => boolean; toggle: (id: number) => void }
const WishlistContext = createContext<Ctx>({ ids: [], has: () => false, toggle: () => undefined });
export const useWishlist = (): Ctx => useContext(WishlistContext);

const KEY = 'wishlist';

/** Favoris : liste d'identifiants gardée dans le navigateur (aucun compte nécessaire). */
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setIds((JSON.parse(raw) as unknown[]).filter((n): n is number => typeof n === 'number')); } catch { /* stockage indisponible */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* idem */ }
  }, [ids, loaded]);
  const toggle = useCallback((id: number) => setIds((cur) => (cur.includes(id) ? cur.filter((i) => i !== id) : [...cur, id])), []);
  const has = useCallback((id: number) => ids.includes(id), [ids]);
  return <WishlistContext.Provider value={{ ids, has, toggle }}>{children}</WishlistContext.Provider>;
}

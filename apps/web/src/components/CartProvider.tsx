'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { productImageUrl } from '../lib';
import { Price } from './Locale';

import type { Product } from '../data/catalogue';
import { useAuth } from './AuthProvider';

export interface CartItem { id: number; name: string; price: number; image: string; quantity: number; color: string; size: string }

interface Ctx {
  items: CartItem[];
  count: number;
  subtotal: number;
  open: boolean;
  toggle: () => void;
  add: (p: Product, qty: number, opts?: { color?: string; size?: string }) => void;
  remove: (id: number) => void;
  setQty: (id: number, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<Ctx | null>(null);
export const useCart = (): Ctx => {
  const c = useContext(CartContext);
  if (!c) throw new Error('useCart hors CartProvider');
  return c;
};

const KEY = 'cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { notify, user, openLogin } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch { /* stockage indisponible : panier non mémorisé */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* idem */ }
  }, [items, loaded]);

  const add = useCallback((p: Product, qty: number, opts: { color?: string; size?: string } = {}) => {
    setItems((cur) => {
      const found = cur.find((i) => i.id === p.id);
      if (found) return cur.map((i) => (i.id === p.id ? { ...i, quantity: i.quantity + qty } : i));
      return [...cur, { id: p.id, name: p.name, price: p.price, image: p.image, quantity: qty, color: opts.color ?? '', size: opts.size ?? '' }];
    });
    notify(`« ${p.name} » ajouté au panier`);
  }, [notify]);
  const remove = useCallback((id: number) => setItems((cur) => cur.filter((i) => i.id !== id)), []);
  const setQty = useCallback((id: number, qty: number) => setItems((cur) => cur.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, Math.floor(qty) || 1) } : i))), []);
  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, subtotal, open, toggle: () => setOpen((o) => !o), add, remove, setQty, clear }}>
      {children}
      <div id="cartDrawer" className={`cart-drawer${open ? ' active' : ''}`}>
        <div className="cart-overlay" onClick={() => setOpen(false)} />
        <div className="cart-content">
          <div className="cart-header">
            <h3>Mon Panier <span id="cartCount">({count})</span></h3>
            <button type="button" className="close-btn" onClick={() => setOpen(false)}><i className="fas fa-times" /></button>
          </div>
          <div className="cart-items" id="cartItems">
            {items.length === 0 ? (
              <div className="empty-cart">
                <i className="fas fa-shopping-bag" />
                <p>Votre panier est vide</p>
                <p>Commencez vos achats pour ajouter des articles</p>
              </div>
            ) : items.map((item) => (
              <div className="cart-item" key={item.id}>
                <img src={productImageUrl(item.image, 150, 150)} alt={item.name} className="cart-item-image" />
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-qty">Qté : <input type="number" value={item.quantity} min={1} onChange={(e) => setQty(item.id, Number(e.target.value))} style={{ width: 40 }} /></div>
                  <div className="cart-item-price"><Price usd={item.price * item.quantity} /></div>
                  <button type="button" onClick={() => remove(item.id)} style={{ background: 'none', border: 'none', color: 'var(--primary-dark)', cursor: 'pointer', fontSize: '0.75rem' }}>Retirer</button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-footer" id="cartFooter">
            {items.length > 0 && (
              <>
                <div className="cart-subtotal"><span>Sous-total</span><span className="cart-subtotal-value"><Price usd={subtotal} /></span></div>
                <button type="button" className="btn btn-primary full-width" onClick={() => {
                  setOpen(false);
                  if (!user) { notify('Connectez-vous pour finaliser votre commande.'); openLogin('signin', '/commande'); return; }
                  router.push('/commande');
                }}>Passer la commande</button>
                <button type="button" className="btn btn-outline full-width" onClick={() => setOpen(false)}>Continuer mes achats</button>
              </>
            )}
          </div>
        </div>
      </div>
    </CartContext.Provider>
  );
}

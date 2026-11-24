'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { productImageUrl } from '../lib';
import { Price } from './Locale';

import { api, errorMessage, useAuth } from './AuthProvider';
import { useCart } from './CartProvider';
import { useCountries } from './Geo';

export interface Address { id: string; label: string; city: string; address: string; phone: string; isDefault: boolean }
export const e164 = (v: FormDataEntryValue | null): string => String(v ?? '').replace(/[\s.-]/g, '');

export function CheckoutArea() {
  const router = useRouter();
  const { user, ready, notify, openLogin } = useAuth();
  const cart = useCart();
  const cities = useCountries().find((c) => c.code === (user?.countryCode ?? 'CD'))?.cities ?? [];
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [newForm, setNewForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pay, setPay] = useState<{ method: 'cod' | 'mobile_money'; provider: string; phone: string }>({ method: 'cod', provider: 'M-Pesa', phone: '' });

  const loadAddresses = useCallback(async () => {
    const r = await api<{ addresses: Address[] }>('/me/addresses');
    if (r.ok) {
      setAddresses(r.data.addresses);
      setSelected((cur) => cur ?? (r.data.addresses.find((a) => a.isDefault) ?? r.data.addresses[0])?.id ?? null);
      if (r.data.addresses.length === 0) setNewForm(true);
    }
    setLoaded(true);
  }, []);
  useEffect(() => { if (user) void loadAddresses(); }, [user, loadAddresses]);

  if (!ready) return <p className="empty-collection">Chargement…</p>;
  if (!user) {
    return (
      <div className="seller-landing" style={{ gridTemplateColumns: '1fr' }}>
        <div className="seller-auth-card" style={{ maxWidth: 420, margin: '0 auto' }}>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Connectez-vous pour finaliser votre commande.</p>
          <button type="button" className="btn btn-primary full-width" onClick={() => openLogin('signin', '/commande')}>Se connecter / Créer un compte</button>
        </div>
      </div>
    );
  }
  if (cart.items.length === 0) {
    return (
      <div className="seller-landing" style={{ gridTemplateColumns: '1fr' }}>
        <div className="seller-auth-card" style={{ maxWidth: 420, margin: '0 auto' }}>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Votre panier est vide.</p>
          <button type="button" className="btn btn-primary full-width" onClick={() => router.push('/collection')}>Découvrir le catalogue</button>
        </div>
      </div>
    );
  }

  async function place(ship: { shippingPhone: string; shippingCity: string; shippingAddress: string }) {
    const paymentPhone = e164(pay.phone || user?.phone || ship.shippingPhone);
    if (pay.method === 'mobile_money' && paymentPhone.length < 8) return notify('Indiquez le numéro Mobile Money à débiter.');
    setBusy(true);
    const r = await api<{ order: { number: string } }>('/orders', {
      method: 'POST',
      body: { items: cart.items.map((i) => ({ id: i.id, quantity: i.quantity, color: i.color, size: i.size })), ...ship, paymentMethod: pay.method, ...(pay.method === 'mobile_money' ? { paymentProvider: pay.provider, paymentPhone } : {}) },
    });
    setBusy(false);
    if (!r.ok) return notify(errorMessage(r.data.code) === 'Une erreur est survenue. Réessayez.' ? (r.data.message ?? errorMessage(r.data.code)) : errorMessage(r.data.code));
    cart.clear();
    notify(`Commande ${r.data.order.number} envoyée au vendeur : il doit l’accepter, vous serez notifié. Suivi dans « Mon compte ».`);
    router.push('/compte');
  }

  async function submitSaved() {
    const a = addresses.find((x) => x.id === selected);
    if (!a) return notify('Merci de sélectionner une adresse.');
    await place({ shippingPhone: a.phone, shippingCity: a.city, shippingAddress: a.address });
  }

  async function submitNew(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const ship = { shippingPhone: e164(f.get('shippingPhone')), shippingCity: String(f.get('shippingCity')), shippingAddress: String(f.get('shippingAddress')).trim() };
    if (f.get('saveAddress')) await api('/me/addresses', { method: 'POST', body: { label: 'Adresse', city: ship.shippingCity, address: ship.shippingAddress, phone: ship.shippingPhone } });
    await place(ship);
  }

  const hasSaved = addresses.length > 0;
  return (
    <div className="seller-landing">
      <div className="seller-pitch">
        <h2>Récapitulatif de votre commande</h2>
        {cart.items.map((item) => (
          <div className="seller-pitch-item" key={item.id}>
            <img src={productImageUrl(item.image, 60, 60)} alt={item.name} className="seller-product-thumb" />
            <div>
              <p className="usp-title">{item.name}</p>
              <p className="usp-sub">Qté {item.quantity}{item.color ? ` · ${item.color}` : ''}{item.size ? ` · ${item.size}` : ''} — <Price usd={item.price * item.quantity} /></p>
            </div>
          </div>
        ))}
        <p style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '1rem' }}>Total : <Price usd={cart.subtotal} /></p>
      </div>

      <div className="seller-auth-card">
        <h2 style={{ marginBottom: '1rem' }}>Adresse de livraison</h2>
        {!loaded ? <p className="empty-collection">Chargement…</p> : (
          <>
            <div style={{ display: hasSaved && !newForm ? 'block' : 'none' }}>
              <div className="checkout-address-list">
                {addresses.map((a) => (
                  <label key={a.id} className={`checkout-address-option${a.id === selected ? ' active' : ''}`} onClick={() => setSelected(a.id)}>
                    <input type="radio" name="checkoutAddress" checked={a.id === selected} readOnly />
                    <div>
                      <p style={{ fontWeight: 700 }}>{a.label}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{a.address} · {a.city} · {a.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
              <button type="button" className="link-btn" style={{ margin: '0.75rem 0' }} onClick={() => setNewForm(true)}>+ Utiliser une nouvelle adresse</button>
              <PaymentBox pay={pay} setPay={setPay} defaultPhone={user.phone ?? ''} />
              <button type="button" className="btn btn-primary full-width" disabled={busy} onClick={() => void submitSaved()}>Confirmer la commande</button>
            </div>

            <div style={{ display: !hasSaved || newForm ? 'block' : 'none' }}>
              {hasSaved && <button type="button" className="link-btn" style={{ marginBottom: '0.75rem' }} onClick={() => setNewForm(false)}>← Revenir à mes adresses enregistrées</button>}
              <form onSubmit={submitNew}>
                <div className="form-group"><label>Téléphone de livraison *</label><input type="tel" name="shippingPhone" placeholder="+243..." defaultValue={user.phone ?? ''} required /></div>
                <div className="form-group">
                  <label>Ville *</label>
                  <input type="text" name="shippingCity" list="shippingCities" placeholder="Votre ville" required />
                  <datalist id="shippingCities">{cities.map((c) => <option key={c.slug} value={c.name} />)}</datalist>
                </div>
                <div className="form-group"><label>Adresse complète *</label><textarea name="shippingAddress" rows={3} placeholder="Quartier, avenue, référence..." required /></div>
                <label className="checkbox-label"><input type="checkbox" name="saveAddress" defaultChecked /><span>Enregistrer cette adresse pour la prochaine fois</span></label>
                <PaymentBox pay={pay} setPay={setPay} defaultPhone={user.phone ?? ''} />
                <button type="submit" className="btn btn-primary full-width" disabled={busy}>Confirmer la commande</button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const PROVIDERS = ['M-Pesa', 'Airtel Money', 'Orange Money', 'Afrimoney'] as const;

/** Choix du mode de paiement avant la validation de la commande. */
function PaymentBox({ pay, setPay, defaultPhone }: { pay: { method: 'cod' | 'mobile_money'; provider: string; phone: string }; setPay: (p: { method: 'cod' | 'mobile_money'; provider: string; phone: string }) => void; defaultPhone: string }) {
  return (
    <div className="payment-box" style={{ margin: '1rem 0' }}>
      <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Mode de paiement</h3>
      <div className="checkout-address-list">
        <label className={`checkout-address-option${pay.method === 'mobile_money' ? ' active' : ''}`} onClick={() => setPay({ ...pay, method: 'mobile_money' })}>
          <input type="radio" name="payMethod" checked={pay.method === 'mobile_money'} readOnly />
          <div><p style={{ fontWeight: 700 }}>Mobile Money</p><p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>M-Pesa, Airtel Money, Orange Money, Afrimoney</p></div>
        </label>
        <label className={`checkout-address-option${pay.method === 'cod' ? ' active' : ''}`} onClick={() => setPay({ ...pay, method: 'cod' })}>
          <input type="radio" name="payMethod" checked={pay.method === 'cod'} readOnly />
          <div><p style={{ fontWeight: 700 }}>Paiement à la livraison</p><p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Vous réglez en espèces à la réception du colis</p></div>
        </label>
      </div>
      {pay.method === 'mobile_money' && (
        <div style={{ marginTop: '0.75rem' }}>
          <div className="form-group"><label>Opérateur *</label>
            <select value={pay.provider} onChange={(e) => setPay({ ...pay, provider: e.target.value })}>{PROVIDERS.map((p) => <option key={p}>{p}</option>)}</select></div>
          <div className="form-group"><label>Numéro Mobile Money *</label>
            <input type="tel" placeholder="+243..." value={pay.phone || defaultPhone} onChange={(e) => setPay({ ...pay, phone: e.target.value })} /></div>
          <p className="seller-form-note">Le paiement est demandé sur ce numéro une fois la commande acceptée par le vendeur. Ne payez rien avant d&apos;avoir reçu la demande.</p>
        </div>
      )}
      {pay.method === 'cod' && <p className="seller-form-note">Le vendeur doit d&apos;abord accepter votre commande ; vous êtes prévenu par notification.</p>}
    </div>
  );
}

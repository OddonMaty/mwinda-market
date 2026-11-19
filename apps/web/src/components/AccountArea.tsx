'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatPrice } from '../lib';
import { api, errorMessage, useAuth } from './AuthProvider';
import { e164, type Address } from './CheckoutArea';
import { useCountries } from './Geo';

interface SessionRow { id: string; kind: string; createdAt: string; lastUsedAt: string; userAgent: string | null; ip: string | null; current: boolean }

interface OrderRow { id: string; number: string; status: string; subtotalUsd: number; city: string; address: string; createdAt: string; canCancel: boolean; canConfirmReceipt: boolean; items: { name: string; unitPriceUsd: number; quantity: number; color: string; size: string; status: string; shop: string }[] }
const STATUS: Record<string, string> = { pending: 'En attente', confirmed: 'Confirmée', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée' };
const day = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const fmt = (d: string) => new Date(d).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

export function AccountArea() {
  const { user, ready, openLogin, logout, notify, refresh } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrForm, setAddrForm] = useState(false);
  const cities = useCountries().find((c) => c.code === (user?.countryCode ?? 'CD'))?.cities ?? [];
  const loadOrders = useCallback(() => api<{ orders: OrderRow[] }>('/orders').then((r) => setOrders(r.ok ? r.data.orders : [])), []);
  async function orderAction(number: string, action: 'cancel' | 'receive') {
    if (action === 'cancel' && !window.confirm('Annuler cette commande ?')) return;
    const r = await api(`/orders/${number}/${action}`, { method: 'POST' });
    if (!r.ok) return notify(r.data.message ?? errorMessage(r.data.code));
    notify(action === 'cancel' ? 'Commande annulée.' : 'Réception confirmée, merci !');
    await loadOrders();
  }

  const loadSessions = useCallback(async () => {
    const r = await api<{ sessions: SessionRow[] }>('/me/sessions');
    if (r.ok) setSessions(r.data.sessions);
  }, []);
  const loadAddresses = useCallback(async () => {
    const r = await api<{ addresses: Address[] }>('/me/addresses');
    if (r.ok) setAddresses(r.data.addresses);
  }, []);
  useEffect(() => {
    if (!user) return;
    void loadSessions();
    void loadAddresses();
    void loadOrders();
  }, [user, loadSessions, loadAddresses, loadOrders]);

  if (!ready) return <p className="empty-collection">Chargement…</p>;

  if (!user) {
    return (
      <div className="seller-landing" style={{ gridTemplateColumns: '1fr' }}>
        <div className="seller-auth-card" style={{ maxWidth: 420, margin: '0 auto' }}>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Connectez-vous ou créez un compte pour suivre vos commandes, enregistrer vos adresses et retrouver votre historique d&apos;achats.</p>
          <button type="button" className="btn btn-primary full-width" onClick={() => openLogin('signin')}>Se connecter / Créer un compte</button>
        </div>
      </div>
    );
  }

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await api('/me', { method: 'PATCH', body: { firstName: f.get('firstName'), lastName: f.get('lastName'), phone: String(f.get('phone') ?? '').replace(/[\s.-]/g, '') } });
    if (!r.ok) return notify(errorMessage(r.data.code));
    await refresh();
    notify('Profil mis à jour');
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await api('/auth/change-password', { method: 'POST', body: { oldPassword: f.get('oldPassword'), newPassword: f.get('newPassword') } });
    if (!r.ok) return notify(errorMessage(r.data.code));
    form.reset();
    await loadSessions();
    notify('Mot de passe modifié. Vos autres appareils ont été déconnectés.');
  }

  async function saveAddress(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await api('/me/addresses', { method: 'POST', body: { label: String(f.get('label') ?? ''), city: f.get('city'), address: String(f.get('address')).trim(), phone: e164(f.get('phone')) } });
    if (!r.ok) return notify(errorMessage(r.data.code));
    setAddrForm(false);
    await loadAddresses();
    notify('Adresse enregistrée');
  }

  async function deleteAddress(id: string) {
    const r = await api(`/me/addresses/${id}`, { method: 'DELETE' });
    if (!r.ok) return notify(errorMessage(r.data.code));
    await loadAddresses();
    notify('Adresse supprimée');
  }

  async function revoke(id: string) {
    const r = await api(`/me/sessions/${id}`, { method: 'DELETE' });
    if (!r.ok) return notify(errorMessage(r.data.code));
    await loadSessions();
    notify('Appareil déconnecté');
  }

  return (
    <>
      <div className="seller-dashboard-header">
        <div>
          <h1>{user.firstName} {user.lastName}</h1>
          <p>{user.email}{user.phone ? ` · ${user.phone}` : ''}{user.emailVerified ? '' : ' · e-mail non vérifié'}</p>
        </div>
        <div className="seller-dashboard-actions">
          {user.roles.length > 0 && <a href="/admin" className="btn btn-primary">Administration</a>}
          <button type="button" className="btn btn-outline" onClick={() => void logout()}>Déconnexion</button>
        </div>
      </div>

      <div className="seller-products-table-wrapper">
        <h2>Mes informations</h2>
        <form onSubmit={saveProfile} key={user.id + user.firstName + user.lastName + user.phone}>
          <div className="form-row">
            <input type="text" name="firstName" defaultValue={user.firstName} placeholder="Prénom *" required />
            <input type="text" name="lastName" defaultValue={user.lastName} placeholder="Nom *" required />
          </div>
          <div className="form-group"><input type="tel" name="phone" defaultValue={user.phone ?? ''} placeholder="Téléphone (+243...)" required /></div>
          <button type="submit" className="btn btn-primary">Enregistrer</button>
        </form>
      </div>

      <div className="seller-products-table-wrapper">
        <h2>Mot de passe</h2>
        <form onSubmit={changePassword}>
          <div className="form-group"><input type="password" name="oldPassword" placeholder="Mot de passe actuel *" required /></div>
          <div className="form-group"><input type="password" name="newPassword" placeholder="Nouveau mot de passe (8 caractères minimum) *" required minLength={8} /></div>
          <button type="submit" className="btn btn-primary">Changer le mot de passe</button>
        </form>
      </div>

      <div className="seller-products-table-wrapper">
        <h2>Appareils connectés</h2>
        {sessions.map((s) => (
          <div key={s.id} className="seller-dashboard-header" style={{ padding: '0.75rem 0', marginBottom: 0 }}>
            <div>
              <p style={{ fontWeight: 600 }}>{s.userAgent ?? 'Appareil inconnu'}{s.current ? ' (cet appareil)' : ''}</p>
              <p>Connecté le {fmt(s.createdAt)} · dernière activité {fmt(s.lastUsedAt)}</p>
            </div>
            {!s.current && <button type="button" className="btn btn-outline" onClick={() => void revoke(s.id)}>Déconnecter</button>}
          </div>
        ))}
      </div>

      <div className="seller-products-table-wrapper">
        <div className="seller-dashboard-header" style={{ padding: '0 0 1rem', marginBottom: '1.5rem', borderBottom: 'none' }}>
          <h2 style={{ fontSize: '1.3rem' }}>Mes adresses</h2>
          <button type="button" className="btn btn-primary" onClick={() => setAddrForm(true)}><i className="fas fa-plus" /> Ajouter une adresse</button>
        </div>
        {addrForm && (
          <div className="seller-product-form-wrapper">
            <h2>Ajouter une adresse</h2>
            <form onSubmit={saveAddress}>
              <div className="form-row">
                <input type="text" name="label" placeholder="Nom (ex. Maison, Bureau)" />
                <input type="text" name="city" list="accountCities" placeholder="Ville *" required />
                <datalist id="accountCities">{cities.map((c) => <option key={c.slug} value={c.name} />)}</datalist>
              </div>
              <div className="form-group"><input type="tel" name="phone" placeholder="Téléphone (+243...) *" defaultValue={user.phone ?? ''} required /></div>
              <div className="form-group"><textarea name="address" rows={3} placeholder="Adresse complète * (quartier, avenue, référence...)" required /></div>
              <div className="seller-form-actions">
                <button type="submit" className="btn btn-primary">Enregistrer</button>
                <button type="button" className="btn btn-outline" onClick={() => setAddrForm(false)}>Annuler</button>
              </div>
            </form>
          </div>
        )}
        {addresses.length === 0 ? (
          <p className="empty-collection">Aucune adresse enregistrée. Ajoutez-en une pour aller plus vite à votre prochaine commande.</p>
        ) : (
          <div className="seller-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {addresses.map((a) => (
              <div className="seller-stat-card" style={{ textAlign: 'left' }} key={a.id}>
                <p style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{a.label} {a.isDefault && <span className="product-badge official-badge" style={{ position: 'static', fontSize: '0.6rem', verticalAlign: 'middle' }}>PAR DÉFAUT</span>}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{a.address}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{a.city} · {a.phone}</p>
                <div className="seller-form-actions" style={{ marginTop: '0.75rem' }}>
                  <button type="button" className="link-btn" onClick={() => void deleteAddress(a.id)}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="seller-products-table-wrapper">
        <h2>Mes commandes</h2>
        {orders === null ? <p className="empty-collection">Chargement de vos commandes…</p> : orders.length === 0 ? (
          <p className="empty-collection">Vous n&apos;avez pas encore passé de commande. Vos achats apparaîtront ici.</p>
        ) : orders.map((o) => (
          <div className="seller-product-form-wrapper" style={{ marginBottom: '1.25rem' }} key={o.id}>
            <div className="seller-dashboard-header" style={{ padding: '0 0 1rem', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem' }}>Commande {o.number}</h2>
                <p style={{ fontSize: '0.85rem' }}>{day(o.createdAt)} · Livraison à {o.city}</p>
              </div>
              <span className="product-badge" style={{ position: 'static' }}>{STATUS[o.status] ?? o.status}</span>
            </div>
            <div className="seller-products-table-scroll">
              <table className="seller-products-table">
                <thead><tr><th>Article</th><th>Boutique</th><th>Qté</th><th>Prix</th><th>État</th></tr></thead>
                <tbody>
                  {o.items.map((i, k) => (
                    <tr key={k}><td>{i.name}{i.color ? ` — ${i.color}` : ''}{i.size ? ` — ${i.size}` : ''}</td><td>{i.shop}</td><td>{i.quantity}</td><td>{formatPrice(i.unitPriceUsd * i.quantity)}</td><td>{STATUS[i.status] ?? i.status}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ textAlign: 'right', marginTop: '0.75rem', fontWeight: 700 }}>Total : {formatPrice(o.subtotalUsd)}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Livraison : {o.address}</p>
            {(o.canCancel || o.canConfirmReceipt) && (
              <div className="seller-form-actions" style={{ marginTop: '1rem' }}>
                {o.canConfirmReceipt && <button type="button" className="btn btn-primary" onClick={() => void orderAction(o.number, 'receive')}>J&apos;ai reçu ma commande</button>}
                {o.canCancel && <button type="button" className="btn btn-outline" onClick={() => void orderAction(o.number, 'cancel')}>Annuler la commande</button>}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

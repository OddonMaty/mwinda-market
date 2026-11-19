'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatPrice } from '../lib';
import { api, errorMessage, useAuth } from './AuthProvider';

type Tab = 'dashboard' | 'users' | 'shops' | 'products' | 'orders' | 'plans' | 'requests' | 'countries' | 'pages' | 'audit';
const TABS: [Tab, string][] = [
  ['dashboard', 'Tableau de bord'], ['users', 'Utilisateurs'], ['shops', 'Boutiques'], ['products', 'Produits'], ['orders', 'Commandes'],
  ['plans', 'Plans'], ['requests', 'Demandes de plan'], ['countries', 'Pays & villes'], ['pages', 'Textes légaux'], ['audit', 'Journal'],
];
const STATUS: Record<string, string> = { pending: 'En attente', confirmed: 'Confirmée', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée', active: 'Actif', suspended: 'Suspendu', archived: 'Archivé' };
const PAGE_LABELS: Record<string, string> = { conditions: 'Conditions générales de vente', confidentialite: 'Politique de confidentialité', 'conditions-vendeur': 'Conditions générales vendeur', remboursement: 'Politique de remboursement', livraison: 'Livraison & retours', paiements: 'Paiements' };
const day = (d: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

/** Charge une liste depuis l'API d'administration et la recharge à la demande. */
function useAdminData<T>(path: string, key: string) {
  const [data, setData] = useState<T[] | null>(null);
  const reload = useCallback(async () => {
    const r = await api<Record<string, T[]>>(path);
    setData(r.ok ? (r.data[key] ?? []) : []);
  }, [path, key]);
  useEffect(() => { void reload(); }, [reload]);
  return [data, reload] as const;
}

function Table({ head, children, empty }: { head: string[]; children: React.ReactNode; empty?: boolean }) {
  if (empty) return <p className="empty-collection">Rien à afficher pour le moment.</p>;
  return (
    <div className="seller-products-table-scroll">
      <table className="seller-products-table">
        <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Search({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input type="search" placeholder="Rechercher…" value={value} onChange={(e) => onChange(e.target.value)} style={{ maxWidth: 320, marginBottom: '1rem' }} />;
}

export function AdminArea() {
  const { user, ready, openLogin, notify } = useAuth();
  const [roles, setRoles] = useState<string[] | null>(null);
  const [tab, setTab] = useState<Tab>('dashboard');

  useEffect(() => {
    if (!user) { setRoles(null); return; }
    void api<{ roles: string[] }>('/admin/me').then((r) => setRoles(r.ok ? r.data.roles : []));
  }, [user]);

  if (!ready || (user && roles === null)) return <p className="empty-collection">Chargement…</p>;
  if (!user) return <div className="seller-auth-card" style={{ margin: '0 auto' }}><p style={{ marginBottom: '1rem' }}>Connectez-vous avec un compte administrateur.</p><button type="button" className="btn btn-primary full-width" onClick={() => openLogin('signin', '/admin')}>Se connecter</button></div>;
  if (!roles || roles.length === 0) return <p className="empty-collection">Accès réservé à l&apos;équipe d&apos;administration.</p>;

  const isSuper = roles.includes('superadmin');
  const fail = (r: { data: { code?: string; message?: string } }) => notify(r.data.message ?? errorMessage(r.data.code));

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {TABS.map(([k, l]) => <button key={k} type="button" className={`btn ${tab === k ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {tab === 'dashboard' && <Dashboard />}
      {tab === 'users' && <Users isSuper={isSuper} notify={notify} fail={fail} />}
      {tab === 'shops' && <Shops notify={notify} fail={fail} />}
      {tab === 'products' && <Products notify={notify} fail={fail} />}
      {tab === 'orders' && <Orders notify={notify} fail={fail} />}
      {tab === 'plans' && <Plans isSuper={isSuper} notify={notify} fail={fail} />}
      {tab === 'requests' && <Requests notify={notify} fail={fail} />}
      {tab === 'countries' && <Countries isSuper={isSuper} notify={notify} fail={fail} />}
      {tab === 'pages' && <Pages notify={notify} fail={fail} />}
      {tab === 'audit' && <Audit isSuper={isSuper} />}
    </>
  );
}

interface P { notify: (m: string) => void; fail: (r: { data: { code?: string; message?: string } }) => void }

function Dashboard() {
  const [s, setS] = useState<{ users: number; shops: number; shopsPending: number; products: number; orders: number; ordersByStatus: Record<string, number>; planRequests: number; salesUsd: number; commissionUsd: number } | null>(null);
  useEffect(() => { void api<{ stats: NonNullable<typeof s> }>('/admin/stats').then((r) => r.ok && setS(r.data.stats)); }, []);
  if (!s) return <p className="empty-collection">Chargement…</p>;
  const card = (v: string | number, l: string) => <div className="seller-stat-card" key={l}><span className="seller-stat-value">{v}</span><span className="seller-stat-label">{l}</span></div>;
  return (
    <>
      <div className="seller-stats">
        {card(s.users, 'Utilisateurs')}{card(s.shops, 'Boutiques vendeurs')}{card(s.products, 'Produits en ligne')}{card(s.orders, 'Commandes')}
      </div>
      <div className="seller-stats">
        {card(formatPrice(s.salesUsd), 'Ventes livrées')}{card(formatPrice(s.commissionUsd), 'Commissions gagnées')}{card(s.planRequests, 'Demandes de plan à traiter')}{card(s.shopsPending, 'Boutiques en attente')}
      </div>
      <div className="seller-product-form-wrapper">
        <h2 style={{ fontSize: '1.1rem' }}>Commandes par état</h2>
        <p>{Object.entries(s.ordersByStatus).map(([k, v]) => `${STATUS[k] ?? k} : ${v}`).join(' · ') || 'Aucune commande.'}</p>
      </div>
    </>
  );
}

function Users({ isSuper, notify, fail }: P & { isSuper: boolean }) {
  const [q, setQ] = useState('');
  const [rows, reload] = useAdminData<{ id: string; email: string; name: string; countryCode: string | null; status: string; createdAt: string; roles: string[]; shop: string | null }>(`/admin/users?q=${encodeURIComponent(q)}`, 'users');
  async function setStatus(id: string, status: string) { const r = await api(`/admin/users/${id}`, { method: 'PATCH', body: { status } }); if (!r.ok) return fail(r); notify('Compte mis à jour'); await reload(); }
  async function setRole(id: string, role: string) { const r = await api(`/admin/users/${id}/roles`, { method: 'PUT', body: { roles: role ? [role] : [] } }); if (!r.ok) return fail(r); notify('Rôle mis à jour'); await reload(); }
  return (
    <>
      <Search value={q} onChange={setQ} />
      <Table head={['Nom', 'E-mail', 'Pays', 'Boutique', 'Inscrit le', 'État', 'Rôle', '']} empty={rows?.length === 0}>
        {rows?.map((u) => (
          <tr key={u.id}>
            <td>{u.name}</td><td>{u.email}</td><td>{u.countryCode ?? '—'}</td><td>{u.shop ?? '—'}</td><td>{day(u.createdAt)}</td><td>{STATUS[u.status]}</td>
            <td>{isSuper ? (
              <select value={u.roles[0] ?? ''} onChange={(e) => void setRole(u.id, e.target.value)}>
                <option value="">Utilisateur</option><option value="moderator">Modérateur</option><option value="finance">Finance</option><option value="superadmin">Super-admin</option>
              </select>
            ) : (u.roles.join(', ') || '—')}</td>
            <td className="seller-product-row-actions"><button type="button" className="link-btn" onClick={() => void setStatus(u.id, u.status === 'active' ? 'suspended' : 'active')}>{u.status === 'active' ? 'Suspendre' : 'Réactiver'}</button></td>
          </tr>
        ))}
      </Table>
    </>
  );
}

function Shops({ notify, fail }: P) {
  const [q, setQ] = useState('');
  const [rows, reload] = useAdminData<{ id: string; name: string; owner: string | null; countryCode: string | null; city: string | null; status: string; plan: string; planExpiresAt: string | null; products: number; isOfficial: boolean }>(`/admin/shops?q=${encodeURIComponent(q)}`, 'shops');
  const [plans] = useAdminData<{ code: string; name: string }>('/admin/plans', 'plans');
  async function patch(id: string, body: object) { const r = await api(`/admin/shops/${id}`, { method: 'PATCH', body }); if (!r.ok) return fail(r); notify('Boutique mise à jour'); await reload(); }
  return (
    <>
      <Search value={q} onChange={setQ} />
      <Table head={['Boutique', 'Propriétaire', 'Lieu', 'Produits', 'Plan', 'État']} empty={rows?.length === 0}>
        {rows?.map((s) => (
          <tr key={s.id}>
            <td>{s.name}{s.isOfficial ? ' (officielle)' : ''}</td><td>{s.owner ?? '—'}</td><td>{[s.city, s.countryCode].filter(Boolean).join(', ') || '—'}</td><td>{s.products}</td>
            <td>
              <select value={s.plan} onChange={(e) => void patch(s.id, { plan: e.target.value })}>{plans?.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}</select>
              {s.plan !== 'free' && <div style={{ fontSize: '0.75rem' }}>jusqu’au {day(s.planExpiresAt)}</div>}
            </td>
            <td><select value={s.status} onChange={(e) => void patch(s.id, { status: e.target.value })}><option value="active">Actif</option><option value="pending">En attente</option><option value="suspended">Suspendu</option></select></td>
          </tr>
        ))}
      </Table>
    </>
  );
}

function Products({ notify, fail }: P) {
  const [q, setQ] = useState('');
  const [rows, reload] = useAdminData<{ id: number; name: string; shop: string; department: string; priceUsd: number; status: string }>(`/admin/products?q=${encodeURIComponent(q)}`, 'products');
  async function setStatus(id: number, status: string) { const r = await api(`/admin/products/${id}`, { method: 'PATCH', body: { status } }); if (!r.ok) return fail(r); notify('Produit mis à jour'); await reload(); }
  return (
    <>
      <Search value={q} onChange={setQ} />
      <Table head={['#', 'Produit', 'Boutique', 'Rayon', 'Prix', 'État', '']} empty={rows?.length === 0}>
        {rows?.map((p) => (
          <tr key={p.id}><td>{p.id}</td><td>{p.name}</td><td>{p.shop}</td><td>{p.department}</td><td>{formatPrice(p.priceUsd)}</td><td>{STATUS[p.status]}</td>
            <td className="seller-product-row-actions"><button type="button" className="link-btn" onClick={() => void setStatus(p.id, p.status === 'active' ? 'archived' : 'active')}>{p.status === 'active' ? 'Retirer' : 'Remettre en ligne'}</button></td></tr>
        ))}
      </Table>
    </>
  );
}

function Orders({ notify, fail }: P) {
  const [q, setQ] = useState('');
  const [rows, reload] = useAdminData<{ number: string; status: string; totalUsd: number; commissionUsd: number; createdAt: string; customer: string; email: string; city: string }>(`/admin/orders?q=${encodeURIComponent(q)}`, 'orders');
  async function setStatus(number: string, status: string) { if (status === 'cancelled' && !window.confirm('Annuler cette commande pour tout le monde ?')) return; const r = await api(`/admin/orders/${number}`, { method: 'PATCH', body: { status } }); if (!r.ok) return fail(r); notify('Commande mise à jour'); await reload(); }
  return (
    <>
      <Search value={q} onChange={setQ} />
      <Table head={['N°', 'Date', 'Client', 'Ville', 'Total', 'Commission', 'État']} empty={rows?.length === 0}>
        {rows?.map((o) => (
          <tr key={o.number}><td>{o.number}</td><td>{day(o.createdAt)}</td><td>{o.customer}<div style={{ fontSize: '0.75rem' }}>{o.email}</div></td><td>{o.city}</td><td>{formatPrice(o.totalUsd)}</td><td>{formatPrice(o.commissionUsd)}</td>
            <td><select value={o.status} onChange={(e) => void setStatus(o.number, e.target.value)}>{Object.entries(STATUS).filter(([k]) => ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(k)).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></td></tr>
        ))}
      </Table>
    </>
  );
}

interface PlanRow { code: string; name: string; priceUsd: number; commissionBps: number; maxProducts: number | null; features: string[]; sort: number; active: boolean }

function Plans({ isSuper, notify, fail }: P & { isSuper: boolean }) {
  const [rows, reload] = useAdminData<PlanRow>('/admin/plans', 'plans');
  const [edit, setEdit] = useState<(PlanRow & { isNew?: boolean }) | null>(null);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!edit) return;
    const f = new FormData(e.currentTarget);
    const body = {
      name: String(f.get('name')).trim(), priceUsd: Number(f.get('priceUsd')), commissionBps: Math.round(Number(f.get('commission')) * 100),
      maxProducts: f.get('maxProducts') ? Number(f.get('maxProducts')) : null, features: String(f.get('features')).split('\n').map((x) => x.trim()).filter(Boolean),
      sort: Number(f.get('sort') ?? 0), active: !!f.get('active'),
    };
    const code = edit.isNew ? String(f.get('code')).trim().toLowerCase() : edit.code;
    const r = await api(`/admin/plans/${code}`, { method: 'PUT', body });
    if (!r.ok) return fail(r);
    notify('Plan enregistré'); setEdit(null); await reload();
  }
  return (
    <>
      <p className="seller-form-note" style={{ marginBottom: '1rem' }}>Les prix sont en dollars par trimestre (affichés en FC aux vendeurs). La commission s&apos;applique aux commandes passées après la modification.</p>
      <Table head={['Plan', 'Prix / trimestre', 'Commission', 'Produits max', 'Actif', '']} empty={rows?.length === 0}>
        {rows?.map((p) => (
          <tr key={p.code}><td>{p.name} <span style={{ fontSize: '0.75rem' }}>({p.code})</span></td><td>{p.priceUsd} $ · {formatPrice(p.priceUsd)}</td><td>{p.commissionBps / 100} %</td><td>{p.maxProducts ?? 'Illimité'}</td><td>{p.active ? 'Oui' : 'Non'}</td>
            <td className="seller-product-row-actions">{isSuper && <button type="button" className="link-btn" onClick={() => setEdit(p)}>Modifier</button>}</td></tr>
        ))}
      </Table>
      {isSuper && !edit && <button type="button" className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={() => setEdit({ code: '', name: '', priceUsd: 0, commissionBps: 300, maxProducts: null, features: [], sort: (rows?.length ?? 0), active: true, isNew: true })}>+ Nouveau plan</button>}
      {edit && (
        <div className="seller-product-form-wrapper" style={{ marginTop: '1.5rem' }} key={edit.code || 'new'}>
          <h2>{edit.isNew ? 'Nouveau plan' : `Modifier ${edit.name}`}</h2>
          <form className="contact-form" onSubmit={save}>
            <div className="form-row">
              {edit.isNew && <input type="text" name="code" placeholder="Code (ex. gold) *" pattern="[a-z][a-z0-9-]{1,19}" required />}
              <input type="text" name="name" placeholder="Nom *" defaultValue={edit.name} required />
            </div>
            <div className="form-row">
              <input type="number" name="priceUsd" step="0.01" min="0" placeholder="Prix par trimestre ($) *" defaultValue={edit.priceUsd} required />
              <input type="number" name="commission" step="0.1" min="0" max="30" placeholder="Commission (%) *" defaultValue={edit.commissionBps / 100} required />
            </div>
            <div className="form-row">
              <input type="number" name="maxProducts" min="1" placeholder="Produits max (vide = illimité)" defaultValue={edit.maxProducts ?? ''} />
              <input type="number" name="sort" min="0" placeholder="Ordre" defaultValue={edit.sort} />
            </div>
            <div className="form-group"><textarea name="features" rows={4} placeholder="Avantages, un par ligne" defaultValue={edit.features.join('\n')} /></div>
            <label className="checkbox-label"><input type="checkbox" name="active" defaultChecked={edit.active} disabled={edit.code === 'free'} /><span>Plan proposé aux vendeurs</span></label>
            <div className="seller-form-actions"><button type="submit" className="btn btn-primary">Enregistrer</button><button type="button" className="btn btn-outline" onClick={() => setEdit(null)}>Annuler</button></div>
          </form>
        </div>
      )}
    </>
  );
}

function Requests({ notify, fail }: P) {
  const [rows, reload] = useAdminData<{ id: string; plan: string; status: string; createdAt: string; shop: string; owner: string | null; priceUsd: number }>('/admin/plan-requests', 'requests');
  async function decide(id: string, d: 'approve' | 'reject') { const r = await api(`/admin/plan-requests/${id}/${d}`, { method: 'POST' }); if (!r.ok) return fail(r); notify(d === 'approve' ? 'Plan activé pour 3 mois' : 'Demande refusée'); await reload(); }
  return (
    <>
      <p className="seller-form-note" style={{ marginBottom: '1rem' }}>Approuvez une demande uniquement après avoir reçu le paiement de l&apos;abonnement : le plan est alors activé pour 3 mois.</p>
      <Table head={['Date', 'Boutique', 'Propriétaire', 'Plan demandé', 'Montant', 'État', '']} empty={rows?.length === 0}>
        {rows?.map((r) => (
          <tr key={r.id}><td>{day(r.createdAt)}</td><td>{r.shop}</td><td>{r.owner ?? '—'}</td><td>{r.plan}</td><td>{formatPrice(r.priceUsd)}</td><td>{r.status === 'pending' ? 'En attente' : r.status === 'approved' ? 'Approuvée' : 'Refusée'}</td>
            <td className="seller-product-row-actions">{r.status === 'pending' && <><button type="button" className="link-btn" onClick={() => void decide(r.id, 'approve')}>Approuver</button><button type="button" className="link-btn" onClick={() => void decide(r.id, 'reject')}>Refuser</button></>}</td></tr>
        ))}
      </Table>
    </>
  );
}

function Countries({ isSuper, notify, fail }: P & { isSuper: boolean }) {
  const [q, setQ] = useState('');
  const [rows, reload] = useAdminData<{ code: string; name: string; phonePrefix: string; active: boolean; currency: string | null; cities: number }>('/admin/countries', 'countries');
  async function toggle(code: string, active: boolean) { const r = await api(`/admin/countries/${code}`, { method: 'PATCH', body: { active } }); if (!r.ok) return fail(r); notify('Pays mis à jour'); await reload(); }
  async function addCity(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; const f = new FormData(form);
    const r = await api('/admin/cities', { method: 'POST', body: { countryCode: f.get('country'), name: String(f.get('name')).trim() } });
    if (!r.ok) return fail(r);
    notify('Ville ajoutée'); form.reset(); await reload();
  }
  const shown = rows?.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <form onSubmit={addCity} className="form-row" style={{ marginBottom: '1.25rem', alignItems: 'center' }}>
        <select name="country" defaultValue="CD" required>{rows?.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</select>
        <input type="text" name="name" placeholder="Nouvelle ville *" required minLength={2} />
        <button type="submit" className="btn btn-primary">Ajouter la ville</button>
      </form>
      <Search value={q} onChange={setQ} />
      <Table head={['Pays', 'Indicatif', 'Devise', 'Villes', 'Ouvert aux vendeurs']} empty={shown?.length === 0}>
        {shown?.map((c) => (
          <tr key={c.code}><td>{c.name} ({c.code})</td><td>{c.phonePrefix}</td><td>{c.currency ?? '—'}</td><td>{c.cities}</td>
            <td>{isSuper ? <input type="checkbox" checked={c.active} onChange={(e) => void toggle(c.code, e.target.checked)} /> : c.active ? 'Oui' : 'Non'}</td></tr>
        ))}
      </Table>
    </>
  );
}

function Pages({ notify, fail }: P) {
  const [rows, reload] = useAdminData<{ slug: string; title: string | null; body: string | null; updatedAt: string | null }>('/admin/pages', 'pages');
  const [slug, setSlug] = useState<string | null>(null);
  const cur = rows?.find((r) => r.slug === slug);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await api(`/admin/pages/${slug}`, { method: 'PUT', body: { title: String(f.get('title')).trim(), body: String(f.get('body')).trim() } });
    if (!r.ok) return fail(r);
    notify('Texte publié'); setSlug(null); await reload();
  }
  async function reset(s: string) { if (!window.confirm('Revenir au texte d’origine du site ?')) return; const r = await api(`/admin/pages/${s}`, { method: 'DELETE' }); if (!r.ok) return fail(r); notify('Texte d’origine rétabli'); setSlug(null); await reload(); }
  return (
    <>
      <p className="seller-form-note" style={{ marginBottom: '1rem' }}>Rédigez ici les textes affichés sur le site. Séparez les paragraphes par une ligne vide, commencez une ligne par « ## » pour un titre de section et par « - » pour une liste.</p>
      <Table head={['Texte', 'État', 'Mis à jour', '']}>
        {rows?.map((p) => (
          <tr key={p.slug}><td>{PAGE_LABELS[p.slug] ?? p.slug}</td><td>{p.title ? 'Personnalisé' : 'Texte d’origine'}</td><td>{day(p.updatedAt)}</td>
            <td className="seller-product-row-actions"><button type="button" className="link-btn" onClick={() => setSlug(p.slug)}>Modifier</button>{p.title && <button type="button" className="link-btn" onClick={() => void reset(p.slug)}>Rétablir</button>}</td></tr>
        ))}
      </Table>
      {slug && cur && (
        <div className="seller-product-form-wrapper" style={{ marginTop: '1.5rem' }} key={slug}>
          <h2>{PAGE_LABELS[slug] ?? slug}</h2>
          <form className="contact-form" onSubmit={save}>
            <div className="form-group"><input type="text" name="title" placeholder="Titre *" defaultValue={cur.title ?? PAGE_LABELS[slug] ?? ''} required /></div>
            <div className="form-group"><textarea name="body" rows={18} placeholder="Texte *" defaultValue={cur.body ?? ''} required /></div>
            <div className="seller-form-actions"><button type="submit" className="btn btn-primary">Publier</button><button type="button" className="btn btn-outline" onClick={() => setSlug(null)}>Annuler</button><a className="btn btn-outline" href={`/${slug}`} target="_blank" rel="noreferrer">Voir la page</a></div>
          </form>
        </div>
      )}
    </>
  );
}

function Audit({ isSuper }: { isSuper: boolean }) {
  const [rows] = useAdminData<{ action: string; targetType: string; targetId: string; createdAt: string; actor: string | null }>('/admin/audit', 'log');
  if (!isSuper) return <p className="empty-collection">Réservé au super-administrateur.</p>;
  return (
    <Table head={['Date', 'Administrateur', 'Action', 'Cible']} empty={rows?.length === 0}>
      {rows?.map((a, i) => <tr key={i}><td>{new Date(a.createdAt).toLocaleString('fr-FR')}</td><td>{a.actor ?? '—'}</td><td>{a.action}</td><td>{a.targetType} {a.targetId}</td></tr>)}
    </Table>
  );
}

'use client';
import { nowLocale, useI18n } from './I18n';

import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Users as UsersIcon, Store, Package, ShoppingBag, Crown, Inbox, Globe2, FileText, ScrollText, Search as SearchIcon, ShieldCheck, Wallet, Percent, Bell, Sparkles } from 'lucide-react';
import { formatUsd } from '../lib';
import { api, errorMessage, useAuth } from './AuthProvider';
import { Showcase } from './AdminShowcase';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Empty, Field, Input, Select, StatCard, Table as UTable, Td, Textarea, Th, DashboardShell, PageLoader, WelcomeDialog, type NavGroup } from './ui';

type Tab = 'dashboard' | 'users' | 'shops' | 'products' | 'orders' | 'plans' | 'requests' | 'countries' | 'pages' | 'audit' | 'promotions' | 'withdrawals';
const NAV: NavGroup[] = [
  { items: [{ key: 'dashboard', label: 'Tableau de bord', icon: BarChart3 }] },
  { title: 'Gestion', items: [
    { key: 'users', label: 'Utilisateurs', icon: UsersIcon }, { key: 'shops', label: 'Boutiques', icon: Store },
    { key: 'products', label: 'Produits', icon: Package }, { key: 'orders', label: 'Commandes', icon: ShoppingBag },
    { key: 'promotions', label: 'Promotions', icon: Sparkles },
  ] },
  { title: 'Abonnements', items: [{ key: 'plans', label: 'Plans', icon: Crown }, { key: 'requests', label: 'Demandes de plan', icon: Inbox }, { key: 'withdrawals', label: 'Retraits vendeurs', icon: Wallet }] },
  { title: 'Configuration', items: [{ key: 'countries', label: 'Pays & villes', icon: Globe2 }, { key: 'pages', label: 'Textes légaux', icon: FileText }, { key: 'audit', label: 'Journal d’audit', icon: ScrollText }] },
];
const STATUS: Record<string, string> = { pending: 'En attente', confirmed: 'Confirmée', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée', active: 'Actif', suspended: 'Suspendu', archived: 'Archivé' };
const TONE: Record<string, 'success' | 'warning' | 'danger' | 'secondary' | 'default'> = { active: 'success', delivered: 'success', approved: 'success', pending: 'warning', confirmed: 'default', shipped: 'default', suspended: 'danger', cancelled: 'danger', rejected: 'danger', archived: 'secondary' };
const PAGE_LABELS: Record<string, string> = { conditions: 'Conditions générales d’utilisation', confidentialite: 'Politique de confidentialité', 'conditions-vendeur': 'Conditions générales vendeur', remboursement: 'Retours et remboursements', livraison: 'Livraison', paiements: 'Paiements' };
const day = (d: string | null) => (d ? new Date(d).toLocaleDateString(nowLocale(), { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const St = ({ s }: { s: string }) => <Badge variant={TONE[s] ?? 'secondary'}>{STATUS[s] ?? s}</Badge>;

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
  if (empty) return <Empty icon={Inbox} title="Rien à afficher" text="Aucun élément ne correspond pour le moment." />;
  return (
    <Card className="overflow-hidden">
      <UTable>
        <thead className="bg-muted/40"><tr>{head.map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
        <tbody>{children}</tbody>
      </UTable>
    </Card>
  );
}
const Actions = ({ children }: { children: React.ReactNode }) => <div className="flex justify-end gap-1">{children}</div>;

function Search({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative mb-4 max-w-sm">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input type="search" className="pl-9" placeholder="Rechercher…" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function AdminArea() {
  useI18n();
  const { user, ready, openLogin, notify } = useAuth();
  const [roles, setRoles] = useState<string[] | null>(null);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [pending, setPending] = useState(0);
  const [shopsPending, setShopsPending] = useState(0);
  const [welcome, setWelcome] = useState(true);

  useEffect(() => {
    if (!user) { setRoles(null); return; }
    void api<{ roles: string[] }>('/admin/me').then((r) => setRoles(r.ok ? r.data.roles : []));
    void api<{ stats: { planRequests: number; shopsPending: number } }>('/admin/stats').then((r) => { if (r.ok) { setPending(r.data.stats.planRequests); setShopsPending(r.data.stats.shopsPending); } });
  }, [user]);

  const gate = (node: React.ReactNode) => <div className="ui ui-shell flex items-center justify-center p-6">{node}</div>;
  if (!ready || (user && roles === null)) return <PageLoader />;
  if (!user) return gate(<Card className="w-full max-w-sm text-center"><CardHeader className="items-center"><ShieldCheck className="size-8 text-primary" /><CardTitle>Espace administrateur</CardTitle><CardDescription>Connectez-vous avec un compte administrateur.</CardDescription></CardHeader><CardContent><Button className="w-full" onClick={() => openLogin('signin', '/admin')}>Se connecter</Button></CardContent></Card>);
  if (!roles || roles.length === 0) return gate(<Empty icon={ShieldCheck} title="Accès réservé" text="Cet espace est réservé à l’équipe d’administration." action={<Button asChild variant="outline"><a href="/">Retour à la boutique</a></Button>} />);

  const isSuper = roles.includes('superadmin');
  const fail = (r: { data: { code?: string; message?: string } }) => notify(r.data.message ?? errorMessage(r.data.code));
  const groups = NAV.map((g) => ({ ...g, items: g.items.map((i) => (i.key === 'requests' ? { ...i, badge: pending } : i.key === 'shops' ? { ...i, badge: shopsPending || undefined } : i)) }));
  const roleLabel = isSuper ? 'Super-administrateur' : roles.map((r) => ({ moderator: 'Modérateur', finance: 'Finance' }[r] ?? r)).join(', ');

  return (
    <DashboardShell hideTabs space="Administration" subtitle={roleLabel} groups={groups} active={tab} onSelect={(k) => setTab(k as Tab)} user={{ name: `${user.firstName} ${user.lastName}`.trim() || user.email || user.phone || '', email: user.email ?? user.phone ?? undefined }} topRight={<NotificationBell onOpenShops={() => setTab('shops')} />}>
      {welcome && <WelcomeDialog title={`Bienvenue, ${user.firstName || 'administrateur'} !`} text={shopsPending > 0 ? `${shopsPending} boutique${shopsPending > 1 ? 's attendent' : ' attend'} votre validation. Acceptez ou refusez chaque demande depuis l’onglet Boutiques.` : 'Tout est à jour : aucune boutique n’attend de validation. Bon travail !'} action="Voir l’administration" onClose={() => setWelcome(false)} />}
      {tab === 'dashboard' && <Dashboard />}
      {tab === 'users' && <Users isSuper={isSuper} notify={notify} fail={fail} />}
      {tab === 'shops' && <Shops notify={notify} fail={fail} />}
      {tab === 'products' && <Products notify={notify} fail={fail} />}
      {tab === 'orders' && <Orders notify={notify} fail={fail} />}
      {tab === 'plans' && <Plans isSuper={isSuper} notify={notify} fail={fail} />}
      {tab === 'requests' && <Requests notify={notify} fail={fail} />}
      {tab === 'withdrawals' && <Withdrawals notify={notify} fail={fail} />}
      {tab === 'countries' && <Countries isSuper={isSuper} notify={notify} fail={fail} />}
      {tab === 'pages' && <Pages notify={notify} fail={fail} />}
      {tab === 'promotions' && <Showcase notify={notify} fail={fail} />}
      {tab === 'audit' && <Audit isSuper={isSuper} />}
    </DashboardShell>
  );
}

interface Notif { id: number; title: string; body: string | null; read: boolean; createdAt: string }
/** Cloche de l'administration : prévient dès qu'une boutique demande son ouverture. */
function NotificationBell({ onOpenShops }: { onOpenShops: () => void }) {
  const [data, setData] = useState<{ unread: number; notifications: Notif[] }>({ unread: 0, notifications: [] });
  const [open, setOpen] = useState(false);
  const load = useCallback(async () => { const r = await api<{ unread: number; notifications: Notif[] }>('/admin/notifications'); if (r.ok) setData(r.data); }, []);
  useEffect(() => { void load(); const t = setInterval(() => { if (!document.hidden) void load(); }, 20000); return () => clearInterval(t); }, [load]);
  async function toggle() {
    const next = !open; setOpen(next);
    if (next && data.unread > 0) { await api('/admin/notifications/read', { method: 'POST' }); setTimeout(() => void load(), 1500); }
  }
  return (
    <div className="relative">
      <Button variant="ghost" size="sm" onClick={() => void toggle()} aria-label="Notifications" data-notif-bell className="relative">
        <Bell />{data.unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground" data-notif-count>{data.unread}</span>}
      </Button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border bg-card shadow-xl">
          <p className="border-b px-4 py-2.5 text-sm font-semibold">Notifications</p>
          <ul className="max-h-80 overflow-y-auto">
            {data.notifications.length === 0 && <li className="p-4 text-sm text-muted-foreground">Aucune notification.</li>}
            {data.notifications.map((n) => (
              <li key={n.id}><button type="button" className="block w-full border-b px-4 py-3 text-left text-sm last:border-0 hover:bg-muted/50" onClick={() => { setOpen(false); onOpenShops(); }}>
                <span className="flex items-center gap-2 font-medium">{!n.read && <span className="size-2 rounded-full bg-primary" />}{n.title}</span>
                {n.body && <span className="block text-xs text-muted-foreground">{n.body}</span>}
                <span className="block text-[11px] text-muted-foreground">{new Date(n.createdAt).toLocaleString(nowLocale(), { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </button></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface P { notify: (m: string) => void; fail: (r: { data: { code?: string; message?: string } }) => void }

function Dashboard() {
  const [s, setS] = useState<{ users: number; shops: number; shopsPending: number; products: number; productsByDepartment: { department: string; name: string; count: number }[]; orders: number; ordersByStatus: Record<string, number>; planRequests: number; salesUsd: number; commissionUsd: number } | null>(null);
  useEffect(() => { void api<{ stats: NonNullable<typeof s> }>('/admin/stats').then((r) => r.ok && setS(r.data.stats)); }, []);
  if (!s) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  return (
    <div className="grid gap-4 sm:gap-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Utilisateurs" value={s.users} icon={UsersIcon} />
        <StatCard label="Boutiques vendeurs" value={s.shops} icon={Store} hint={s.shopsPending ? `${s.shopsPending} en attente` : undefined} />
        <StatCard label="Produits en ligne" value={s.products} icon={Package} />
        <StatCard label="Commandes" value={s.orders} icon={ShoppingBag} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        <StatCard label="Ventes livrées" value={formatUsd(s.salesUsd)} icon={Wallet} />
        <StatCard label="Commissions gagnées" value={formatUsd(s.commissionUsd)} icon={Percent} />
        <StatCard label="Demandes de plan à traiter" value={s.planRequests} icon={Inbox} />
      </div>
      <Card>
        <CardHeader><CardTitle>Produits par rayon</CardTitle><CardDescription>Nombre de produits actifs dans chaque rayon du catalogue.</CardDescription></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {s.productsByDepartment.map((d) => <span key={d.department} className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm">{d.name}<b>{d.count}</b></span>)}
          {s.productsByDepartment.length === 0 && <p className="text-sm text-muted-foreground">Aucun produit actif.</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Commandes par état</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.entries(s.ordersByStatus).map(([k, v]) => <span key={k} className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm"><St s={k} /><b>{v}</b></span>)}
          {Object.keys(s.ordersByStatus).length === 0 && <p className="text-sm text-muted-foreground">Aucune commande pour le moment.</p>}
        </CardContent>
      </Card>
    </div>
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
            <Td>{u.name}</Td><Td>{u.email ?? '—'}</Td><Td>{u.countryCode ?? '—'}</Td><Td>{u.shop ?? '—'}</Td><Td>{day(u.createdAt)}</Td><Td><St s={u.status} /></Td>
            <Td>{isSuper ? (
              <Select className="h-9 min-w-[8rem]" value={u.roles[0] ?? ''} onChange={(e) => void setRole(u.id, e.target.value)}>
                <option value="">Utilisateur</option><option value="moderator">Modérateur</option><option value="finance">Finance</option><option value="superadmin">Super-admin</option>
              </Select>
            ) : (u.roles.join(', ') || '—')}</Td>
            <Td className="text-right"><Actions><Button type="button" variant="ghost" size="sm" onClick={() => void setStatus(u.id, u.status === 'active' ? 'suspended' : 'active')}>{u.status === 'active' ? 'Suspendre' : 'Réactiver'}</Button></Actions></Td>
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
            <Td>{s.name}{s.isOfficial ? ' (officielle)' : ''}</Td><Td>{s.owner ?? '—'}</Td><Td>{[s.city, s.countryCode].filter(Boolean).join(', ') || '—'}</Td><Td>{s.products}</Td>
            <Td>
              <Select className="h-9 min-w-[8rem]" value={s.plan} onChange={(e) => void patch(s.id, { plan: e.target.value })}>{plans?.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}</Select>
              {s.plan !== 'free' && <div className="mt-1 text-xs text-muted-foreground">jusqu’au {day(s.planExpiresAt)}</div>}
            </Td>
            <Td>
              {s.status === 'pending' && !s.isOfficial && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void patch(s.id, { status: 'active' })}>Accepter</Button>
                  <Button size="sm" variant="outline" onClick={() => { const reason = window.prompt('Motif du refus (facultatif) :', ''); if (reason !== null) void patch(s.id, { status: 'rejected', reason }); }}>Refuser</Button>
                </div>
              )}
              {!(s.status === 'pending' && !s.isOfficial) && <Select className="h-9 min-w-[8rem]" value={s.status} onChange={(e) => void patch(s.id, { status: e.target.value })}><option value="active">Actif</option><option value="pending">En attente</option><option value="suspended">Suspendu</option><option value="rejected">Refusé</option></Select>}
            </Td>
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
          <tr key={p.id}><Td>{p.id}</Td><Td>{p.name}</Td><Td>{p.shop}</Td><Td>{p.department}</Td><Td>{formatUsd(p.priceUsd)}</Td><Td><St s={p.status} /></Td>
            <Td className="text-right"><Actions><Button type="button" variant="ghost" size="sm" onClick={() => void setStatus(p.id, p.status === 'active' ? 'archived' : 'active')}>{p.status === 'active' ? 'Retirer' : 'Remettre en ligne'}</Button></Actions></Td></tr>
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
          <tr key={o.number}><Td>{o.number}</Td><Td>{day(o.createdAt)}</Td><Td>{o.customer}<div className="text-xs text-muted-foreground">{o.email}</div></Td><Td>{o.city}</Td><Td>{formatUsd(o.totalUsd)}</Td><Td>{formatUsd(o.commissionUsd)}</Td>
            <Td><Select className="h-9 min-w-[8rem]" value={o.status} onChange={(e) => void setStatus(o.number, e.target.value)}>{Object.entries(STATUS).filter(([k]) => ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(k)).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Td></tr>
        ))}
      </Table>
    </>
  );
}

interface PlanRow { code: string; name: string; priceUsd: number; commissionBps: number; maxProducts: number | null; features: string[]; sort: number; active: boolean; certified: boolean; heroEligible: boolean }

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
      sort: Number(f.get('sort') ?? 0), active: !!f.get('active'), certified: !!f.get('certified'), heroEligible: !!f.get('heroEligible'),
    };
    const code = edit.isNew ? String(f.get('code')).trim().toLowerCase() : edit.code;
    const r = await api(`/admin/plans/${code}`, { method: 'PUT', body });
    if (!r.ok) return fail(r);
    notify('Plan enregistré'); setEdit(null); await reload();
  }
  return (
    <>
      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">Les prix sont en dollars par trimestre (la monnaie locale n’est affichée qu’à titre indicatif). La commission s&apos;applique aux commandes passées après la modification.</p>
      <Table head={['Plan', 'Prix / trimestre', 'Commission', 'Produits max', 'Actif', '']} empty={rows?.length === 0}>
        {rows?.map((p) => (
          <tr key={p.code}><Td>{p.name} <span className="text-xs text-muted-foreground">({p.code})</span></Td><Td>{p.priceUsd} $ · {formatUsd(p.priceUsd)}</Td><Td>{p.commissionBps / 100} %</Td><Td>{p.maxProducts ?? 'Illimité'}</Td><Td>{p.active ? 'Oui' : 'Non'}</Td>
            <Td className="text-right"><Actions>{isSuper && <Button type="button" variant="ghost" size="sm" onClick={() => setEdit(p)}>Modifier</Button>}</Actions></Td></tr>
        ))}
      </Table>
      {isSuper && !edit && <Button type="button" variant="outline" className="mt-4" onClick={() => setEdit({ code: '', name: '', priceUsd: 0, commissionBps: 300, maxProducts: null, features: [], sort: (rows?.length ?? 0), active: true, certified: false, heroEligible: false, isNew: true })}>+ Nouveau plan</Button>}
      {edit && (
        <Card className="mt-6 max-w-2xl" key={edit.code || 'new'}>
          <CardHeader><CardTitle>{edit.isNew ? 'Nouveau plan' : `Modifier ${edit.name}`}</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={save}>
              <div className="grid gap-4 sm:grid-cols-2">
                {edit.isNew && <Field label="Code *" hint="Lettres minuscules, ex. gold"><Input name="code" pattern="[a-z][a-z0-9-]{1,19}" required /></Field>}
                <Field label="Nom *"><Input name="name" defaultValue={edit.name} required /></Field>
                <Field label="Prix par trimestre ($) *"><Input type="number" name="priceUsd" step="0.01" min="0" defaultValue={edit.priceUsd} required /></Field>
                <Field label="Commission (%) *"><Input type="number" name="commission" step="0.1" min="0" max="30" defaultValue={edit.commissionBps / 100} required /></Field>
                <Field label="Produits max" hint="Vide = illimité"><Input type="number" name="maxProducts" min="1" defaultValue={edit.maxProducts ?? ''} /></Field>
                <Field label="Ordre d’affichage"><Input type="number" name="sort" min="0" defaultValue={edit.sort} /></Field>
              </div>
              <Field label="Avantages" hint="Un avantage par ligne"><Textarea name="features" rows={4} defaultValue={edit.features.join('\n')} /></Field>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="certified" defaultChecked={edit.certified} disabled={edit.code === 'free'} />Certification « Vendeur certifié » incluse</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="heroEligible" defaultChecked={edit.heroEligible} disabled={edit.code === 'free'} />Éligible aux promotions (accueil et carrousel, sur sélection de l’administrateur)</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={edit.active} disabled={edit.code === 'free'} />Plan proposé aux vendeurs</label>
              <div className="flex gap-2"><Button type="submit">Enregistrer</Button><Button type="button" variant="outline" onClick={() => setEdit(null)}>Annuler</Button></div>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function Requests({ notify, fail }: P) {
  const [rows, reload] = useAdminData<{ id: string; plan: string; status: string; createdAt: string; shop: string; owner: string | null; priceUsd: number }>('/admin/plan-requests', 'requests');
  async function decide(id: string, d: 'approve' | 'reject') { const r = await api(`/admin/plan-requests/${id}/${d}`, { method: 'POST' }); if (!r.ok) return fail(r); notify(d === 'approve' ? 'Plan activé pour 3 mois' : 'Demande refusée'); await reload(); }
  return (
    <>
      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">Approuvez une demande uniquement après avoir reçu le paiement de l&apos;abonnement : le plan est alors activé pour 3 mois.</p>
      <Table head={['Date', 'Boutique', 'Propriétaire', 'Plan demandé', 'Montant', 'État', '']} empty={rows?.length === 0}>
        {rows?.map((r) => (
          <tr key={r.id}><Td>{day(r.createdAt)}</Td><Td>{r.shop}</Td><Td>{r.owner ?? '—'}</Td><Td>{r.plan}</Td><Td>{formatUsd(r.priceUsd)}</Td><Td><Badge variant={TONE[r.status] ?? 'secondary'}>{r.status === 'pending' ? 'En attente' : r.status === 'approved' ? 'Approuvée' : 'Refusée'}</Badge></Td>
            <Td className="text-right"><Actions>{r.status === 'pending' && <><Button type="button" variant="ghost" size="sm" onClick={() => void decide(r.id, 'approve')}>Approuver</Button><Button type="button" variant="ghost" size="sm" onClick={() => void decide(r.id, 'reject')}>Refuser</Button></>}</Actions></Td></tr>
        ))}
      </Table>
    </>
  );
}

function Withdrawals({ notify, fail }: P) {
  const [rows, reload] = useAdminData<{ id: string; shop: string; owner: string | null; amountUsd: number; method: string; provider: string; accountName: string; accountNumber: string; status: string; reference: string | null; reason: string | null; createdAt: string }>('/admin/withdrawals', 'withdrawals');
  async function pay(id: string) {
    const reference = window.prompt('Référence du paiement effectué (transaction Mobile Money, virement…) — facultatif :');
    if (reference === null) return;
    const r = await api(`/admin/withdrawals/${id}/pay`, { method: 'POST', body: { reference: reference.trim() || undefined } });
    if (!r.ok) return fail(r);
    notify('Retrait marqué comme payé : le vendeur est prévenu.'); await reload();
  }
  async function reject(id: string) {
    const reason = window.prompt('Motif du refus (communiqué au vendeur) :');
    if (!reason?.trim()) return;
    const r = await api(`/admin/withdrawals/${id}/reject`, { method: 'POST', body: { reason: reason.trim() } });
    if (!r.ok) return fail(r);
    notify('Retrait refusé : le montant retourne au solde du vendeur.'); await reload();
  }
  const label: Record<string, string> = { pending: 'À payer', paid: 'Payé', rejected: 'Refusé' };
  return (
    <>
      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">Envoyez l&apos;argent au vendeur (Mobile Money ou virement) <b>avant</b> de cliquer sur « Marquer payé » : le vendeur est alors prévenu par e-mail ou WhatsApp. Un refus remet le montant dans son solde.</p>
      <Table head={['Date', 'Boutique', 'Montant', 'Destination', 'État', '']} empty={rows?.length === 0}>
        {rows?.map((r) => (
          <tr key={r.id}><Td>{day(r.createdAt)}</Td><Td>{r.shop}<div className="text-xs text-muted-foreground">{r.owner ?? ''}</div></Td><Td>{formatUsd(r.amountUsd)}</Td>
            <Td>{r.provider} · {r.accountNumber}<div className="text-xs text-muted-foreground">{r.accountName}</div></Td>
            <Td><Badge variant={TONE[r.status] === undefined ? (r.status === 'paid' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning') : TONE[r.status]}>{label[r.status] ?? r.status}</Badge>{r.reference && <div className="text-xs text-muted-foreground">Réf. {r.reference}</div>}{r.reason && <div className="text-xs text-muted-foreground">{r.reason}</div>}</Td>
            <Td className="text-right"><Actions>{r.status === 'pending' && <><Button type="button" variant="ghost" size="sm" onClick={() => void pay(r.id)}>Marquer payé</Button><Button type="button" variant="ghost" size="sm" onClick={() => void reject(r.id)}>Refuser</Button></>}</Actions></Td></tr>
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
      <Card className="mb-6"><CardContent className="pt-5">
        <form onSubmit={addCity} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Field label="Pays"><Select name="country" defaultValue="CD" required>{rows?.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</Select></Field>
          <Field label="Nouvelle ville *"><Input name="name" required minLength={2} /></Field>
          <Button type="submit">Ajouter la ville</Button>
        </form>
      </CardContent></Card>
      <Search value={q} onChange={setQ} />
      <Table head={['Pays', 'Indicatif', 'Devise', 'Villes', 'Ouvert aux vendeurs']} empty={shown?.length === 0}>
        {shown?.map((c) => (
          <tr key={c.code}><Td>{c.name} ({c.code})</Td><Td>{c.phonePrefix}</Td><Td>{c.currency ?? '—'}</Td><Td>{c.cities}</Td>
            <Td>{isSuper ? <input type="checkbox" checked={c.active} onChange={(e) => void toggle(c.code, e.target.checked)} /> : c.active ? 'Oui' : 'Non'}</Td></tr>
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
      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">Rédigez ici les textes affichés sur le site. Séparez les paragraphes par une ligne vide, commencez une ligne par « ## » pour un titre de section et par « - » pour une liste.</p>
      <Table head={['Texte', 'État', 'Mis à jour', '']}>
        {rows?.map((p) => (
          <tr key={p.slug}><Td>{PAGE_LABELS[p.slug] ?? p.slug}</Td><Td>{p.title ? 'Personnalisé' : 'Texte d’origine'}</Td><Td>{day(p.updatedAt)}</Td>
            <Td className="text-right"><Actions><Button type="button" variant="ghost" size="sm" onClick={() => setSlug(p.slug)}>Modifier</Button>{p.title && <Button type="button" variant="ghost" size="sm" onClick={() => void reset(p.slug)}>Rétablir</Button>}</Actions></Td></tr>
        ))}
      </Table>
      {slug && cur && (
        <Card className="mt-6" key={slug}>
          <CardHeader><CardTitle>{PAGE_LABELS[slug] ?? slug}</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={save}>
              <Field label="Titre *"><Input name="title" defaultValue={cur.title ?? PAGE_LABELS[slug] ?? ''} required /></Field>
              <Field label="Texte *"><Textarea name="body" rows={18} className="font-mono text-[13px]" defaultValue={cur.body ?? ''} required /></Field>
              <div className="flex flex-wrap gap-2"><Button type="submit">Publier</Button><Button type="button" variant="outline" onClick={() => setSlug(null)}>Annuler</Button><Button asChild variant="ghost"><a href={`/${slug}`} target="_blank" rel="noreferrer">Voir la page</a></Button></div>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function Audit({ isSuper }: { isSuper: boolean }) {
  const [rows] = useAdminData<{ action: string; targetType: string; targetId: string; createdAt: string; actor: string | null }>('/admin/audit', 'log');
  if (!isSuper) return <Empty icon={ShieldCheck} title="Réservé au super-administrateur" />;
  return (
    <Table head={['Date', 'Administrateur', 'Action', 'Cible']} empty={rows?.length === 0}>
      {rows?.map((a, i) => <tr key={i} className="hover:bg-muted/30"><Td>{new Date(a.createdAt).toLocaleString(nowLocale())}</Td><Td>{a.actor ?? '—'}</Td><Td>{a.action}</Td><Td>{a.targetType} {a.targetId}</Td></tr>)}
    </Table>
  );
}

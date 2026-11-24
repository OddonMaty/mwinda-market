'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, ShoppingBag, MapPin, UserRound, ShieldCheck, Store, LogOut, Plus, Package, Truck, CheckCircle2, Clock, Trash2, Laptop, KeyRound, MessageCircle, Heart } from 'lucide-react';
import { Price } from './Locale';
import { ConversationList, Thread, type Conv } from './Chat';
import { api, errorMessage, useAuth } from './AuthProvider';
import { e164, type Address } from './CheckoutArea';
import { useCountries } from './Geo';
import { VerifyPanel } from './VerifyPanel';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DashboardShell, Empty, PageLoader, Field, Input, PageHeading, StatCard, Table, Td, Textarea, Th, type NavGroup } from './ui';

interface SessionRow { id: string; kind: string; createdAt: string; lastUsedAt: string; userAgent: string | null; ip: string | null; current: boolean }

interface OrderRow { id: string; number: string; status: string; subtotalUsd: number; city: string; address: string; createdAt: string; canCancel: boolean; canConfirmReceipt: boolean; items: { name: string; unitPriceUsd: number; quantity: number; color: string; size: string; status: string; shop: string }[] }
const STATUS: Record<string, string> = { pending: 'En attente', confirmed: 'Confirmée', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée' };
const TONE: Record<string, 'success' | 'warning' | 'danger' | 'default'> = { pending: 'warning', confirmed: 'default', shipped: 'default', delivered: 'success', cancelled: 'danger' };
const day = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const fmt = (d: string) => new Date(d).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
type Tab = 'dashboard' | 'orders' | 'messages' | 'addresses' | 'profile' | 'security';

export function AccountArea() {
  const { user, ready, openLogin, logout, notify, refresh } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [conv, setConv] = useState<Conv | null>(null);
  const [filter, setFilter] = useState('all');
  const [mf, setMf] = useState<'all' | 'active' | 'shipped' | 'delivered'>('all');
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

  const gate = (node: React.ReactNode) => <div className="ui ui-shell flex items-center justify-center p-6">{node}</div>;
  if (!ready) return <PageLoader />;
  if (!user) {
    return gate(
      <Card className="w-full max-w-sm text-center">
        <CardHeader className="items-center"><UserRound className="size-8 text-primary" /><CardTitle>Mon compte</CardTitle><CardDescription>Connectez-vous ou créez un compte pour suivre vos commandes, enregistrer vos adresses et retrouver votre historique d&apos;achats.</CardDescription></CardHeader>
        <CardContent className="grid gap-2"><Button onClick={() => openLogin('signin')}>Se connecter / Créer un compte</Button><Button asChild variant="ghost"><Link href="/">Retour à la boutique</Link></Button></CardContent>
      </Card>,
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

  const count = (st: string) => orders?.filter((o) => o.status === st).length ?? 0;
  const fullName = `${user.firstName} ${user.lastName}`.trim() || user.email || user.phone || 'Mon compte';
  const contact = user.email ?? user.phone ?? '';
  const groups: NavGroup[] = [
    { items: [{ key: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard }] },
    { title: 'Achats', items: [{ key: 'orders', label: 'Mes commandes', icon: ShoppingBag, badge: orders?.length || undefined }, { key: 'messages', label: 'Mes messages', icon: MessageCircle }, { key: 'addresses', label: 'Mes adresses', icon: MapPin }] },
    { title: 'Paramètres', items: [{ key: 'profile', label: 'Mon profil', icon: UserRound }, { key: 'security', label: 'Sécurité et appareils', icon: ShieldCheck }] },
  ];
  const visible = (orders ?? []).filter((o) => filter === 'all' || o.status === filter);

  const orderCard = (o: OrderRow) => (
    <Card key={o.id} className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-5 py-3">
        <div><p className="text-sm font-semibold">Commande {o.number}</p><p className="text-xs text-muted-foreground">{day(o.createdAt)} · Livraison à {o.city}</p></div>
        <Badge variant={TONE[o.status] ?? 'secondary'}>{STATUS[o.status] ?? o.status}</Badge>
      </div>
      <Table>
        <thead><tr><Th>Article</Th><Th className="hidden sm:table-cell">Boutique</Th><Th>Qté</Th><Th>Prix</Th><Th>État</Th></tr></thead>
        <tbody>
          {o.items.map((i, k) => (
            <tr key={k}><Td>{i.name}{i.color ? ` — ${i.color}` : ''}{i.size ? ` — ${i.size}` : ''}</Td><Td className="hidden sm:table-cell">{i.shop}</Td><Td>{i.quantity}</Td><Td><Price usd={i.unitPriceUsd * i.quantity} /></Td><Td><Badge variant={TONE[i.status] ?? 'secondary'}>{STATUS[i.status] ?? i.status}</Badge></Td></tr>
          ))}
        </tbody>
      </Table>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <p className="text-xs text-muted-foreground">Livraison : {o.address}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm">Total <b><Price usd={o.subtotalUsd} /></b></span>
          {o.status !== 'cancelled' && <Button asChild size="sm" variant="outline"><Link href={`/suivi?n=${o.number}`}><MapPin />Suivre</Link></Button>}
          {o.canConfirmReceipt && <Button size="sm" onClick={() => void orderAction(o.number, 'receive')}>J&apos;ai reçu ma commande</Button>}
          {o.canCancel && <Button size="sm" variant="outline" onClick={() => void orderAction(o.number, 'cancel')}>Annuler</Button>}
        </div>
      </div>
    </Card>
  );

  return (
    <DashboardShell space="Mon compte" subtitle={contact} groups={groups} active={tab} onSelect={(k) => setTab(k as Tab)} user={{ name: fullName, email: contact }}
      topRight={<>
        {user.roles.length > 0 && <Button asChild variant="outline" size="sm"><a href="/admin"><ShieldCheck /><span className="hidden sm:inline">Administration</span></a></Button>}
        <Button asChild variant="outline" size="sm"><Link href="/vendeur"><Store /><span className="hidden sm:inline">Espace vendeur</span></Link></Button>
        <Button variant="ghost" size="sm" onClick={() => void logout()}><LogOut /><span className="hidden sm:inline">Déconnexion</span></Button>
      </>}>
      {tab === 'dashboard' && (
        <div className="grid gap-4 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">{fullName.charAt(0).toUpperCase()}</div>
            <div className="min-w-0 flex-1"><p className="truncate font-semibold">{fullName}</p><p className="truncate text-xs text-muted-foreground">{contact}</p></div>
            <button type="button" aria-label="Réglages" className="rounded-full p-2 text-muted-foreground" onClick={() => setTab('profile')}><UserRound className="size-5" /></button>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <button type="button" onClick={() => { setFilter('all'); setTab('orders'); }} className="flex flex-col items-center gap-1.5 py-1"><ShoppingBag className="size-6" />Commandes</button>
            <Link href="/favoris" className="flex flex-col items-center gap-1.5 py-1"><Heart className="size-6" />Favoris</Link>
            <button type="button" onClick={() => setTab('addresses')} className="flex flex-col items-center gap-1.5 py-1"><MapPin className="size-6" />Adresses</button>
            <button type="button" onClick={() => setTab('messages')} className="flex flex-col items-center gap-1.5 py-1"><MessageCircle className="size-6" />Messages</button>
          </div>
          {!user.verified && <VerifyPanel />}
          <div className="flex border-b text-sm">
            {([['all', 'Tous'], ['active', 'En cours'], ['shipped', 'Expédiées'], ['delivered', 'Livrées']] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setMf(k)} className={`flex-1 border-b-2 py-2.5 ${mf === k ? 'border-primary font-semibold text-primary' : 'border-transparent text-muted-foreground'}`}>{l}</button>
            ))}
          </div>
          {orders === null ? <p className="text-sm text-muted-foreground">Chargement de vos commandes…</p> : (() => {
            const list = orders.filter((o) => mf === 'all' || (mf === 'active' ? o.status === 'pending' || o.status === 'confirmed' : o.status === mf));
            return list.length === 0 ? <Empty icon={ShoppingBag} title="Aucune commande" text="Vos achats apparaîtront ici." action={<Button asChild><Link href="/collection">Découvrir les produits</Link></Button>} />
              : list.map((o) => (
                <Link key={o.id} href={`/suivi?n=${o.number}`} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-muted"><Package className="size-6 text-muted-foreground" /></span>
                  <span className="min-w-0 flex-1"><b className="block truncate text-sm">#{o.number}</b><span className="block text-xs text-muted-foreground">{day(o.createdAt)} · {o.items.reduce((n, i) => n + i.quantity, 0)} article(s)</span><b className="text-sm"><Price usd={o.subtotalUsd} /></b></span>
                  <Badge variant={TONE[o.status] ?? 'secondary'}>{STATUS[o.status] ?? o.status}</Badge>
                </Link>
              ));
          })()}
        </div>
      )}
      {tab === 'dashboard' && (
        <div className="hidden gap-6 lg:grid">
          <Card><CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">{fullName.charAt(0).toUpperCase()}</div>
            <div className="min-w-0 flex-1"><p className="text-lg font-semibold">{fullName}</p><p className="truncate text-sm text-muted-foreground">{[user.email, user.phone].filter(Boolean).join(' · ')}</p>
              {user.verified ? <Badge variant="success" className="mt-1">Compte vérifié</Badge> : <Badge variant="secondary" className="mt-1">Non vérifié (facultatif)</Badge>}</div>
            <Button variant="dark" className="w-full sm:w-auto" onClick={() => setTab('profile')}>Modifier mon profil</Button>
          </CardContent></Card>
          {!user.verified && <VerifyPanel />}
          <div>
            <PageHeading title="Mes commandes" actions={<Button variant="link" onClick={() => { setFilter('all'); setTab('orders'); }}>Tout voir</Button>} />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <button type="button" className="text-left" onClick={() => { setFilter('pending'); setTab('orders'); }}><StatCard label="À confirmer" value={count('pending')} icon={Clock} /></button>
              <button type="button" className="text-left" onClick={() => { setFilter('confirmed'); setTab('orders'); }}><StatCard label="En préparation" value={count('confirmed')} icon={Package} /></button>
              <button type="button" className="text-left" onClick={() => { setFilter('shipped'); setTab('orders'); }}><StatCard label="En livraison" value={count('shipped')} icon={Truck} /></button>
              <button type="button" className="text-left" onClick={() => { setFilter('delivered'); setTab('orders'); }}><StatCard label="Livrées" value={count('delivered')} icon={CheckCircle2} /></button>
            </div>
          </div>
          <Card>
            <CardHeader><CardTitle>Votre profil</CardTitle><CardDescription>Complétez ces étapes pour commander plus vite.</CardDescription></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setTab('addresses')} className="flex items-center gap-3 rounded-xl border p-4 text-left hover:bg-muted/40"><MapPin className="size-5 text-primary" /><span className="flex-1"><b className="block text-sm">Ajouter votre adresse</b><span className="text-xs text-muted-foreground">Livraison en quelques clics</span></span>{addresses.length > 0 && <Badge variant="success">Ajoutée</Badge>}</button>
              <button type="button" onClick={() => setTab('security')} className="flex items-center gap-3 rounded-xl border p-4 text-left hover:bg-muted/40"><KeyRound className="size-5 text-primary" /><span className="flex-1"><b className="block text-sm">Sécuriser votre compte</b><span className="text-xs text-muted-foreground">Mot de passe et appareils</span></span></button>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'orders' && (
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {[['all', 'Toutes'], ['pending', 'En attente'], ['confirmed', 'Confirmées'], ['shipped', 'Expédiées'], ['delivered', 'Livrées'], ['cancelled', 'Annulées']].map(([k, l]) => (
              <button key={k} type="button" onClick={() => setFilter(k!)} className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${filter === k ? 'border-primary bg-primary/10 font-medium text-accent-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}>{l}</button>
            ))}
          </div>
          {orders === null ? <p className="text-sm text-muted-foreground">Chargement de vos commandes…</p>
            : visible.length === 0 ? <Empty icon={ShoppingBag} title="Aucune commande" text="Vos achats apparaîtront ici." action={<Button asChild><Link href="/collection">Découvrir les produits</Link></Button>} />
            : visible.map(orderCard)}
        </div>
      )}

      {tab === 'messages' && (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Card className={`overflow-hidden${conv ? ' hidden lg:block' : ''}`}><CardHeader><CardTitle>Mes discussions</CardTitle><CardDescription>Vos questions aux vendeurs, avant et après commande.</CardDescription></CardHeader>
            <div className="max-h-[480px] overflow-y-auto"><ConversationList as="buyer" activeId={conv?.id} onOpen={setConv} /></div></Card>
          <Card className={`overflow-hidden${conv ? '' : ' hidden lg:block'}`}><div className="flex items-center gap-2 border-b px-5 py-3 text-sm font-semibold">{conv && <button type="button" className="-ml-2 rounded-lg px-2 py-1 text-primary lg:hidden" onClick={() => setConv(null)}>← Retour</button>}<span className="truncate">{conv ? conv.other : 'Sélectionnez une discussion'}</span></div>
            {conv ? <Thread key={conv.id} conversationId={conv.id} className="h-[calc(100dvh-17rem)] min-h-[320px] lg:h-[440px]" /> : <p className="p-8 text-center text-sm text-muted-foreground">Choisissez une discussion pour la lire et répondre.</p>}</Card>
        </div>
      )}

      {tab === 'addresses' && (
        <div className="grid gap-4">
          <PageHeading description="Enregistrez vos adresses de livraison pour commander plus vite." actions={!addrForm && <Button onClick={() => setAddrForm(true)}><Plus />Ajouter une adresse</Button>} />
          {addrForm && (
            <Card className="max-w-2xl"><CardHeader><CardTitle>Nouvelle adresse</CardTitle></CardHeader><CardContent>
              <form className="grid gap-4" onSubmit={saveAddress}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nom de l’adresse"><Input name="label" placeholder="Maison, Bureau…" /></Field>
                  <Field label="Ville *"><Input name="city" list="accountCities" required /><datalist id="accountCities">{cities.map((c) => <option key={c.slug} value={c.name} />)}</datalist></Field>
                </div>
                <Field label="Téléphone *"><Input type="tel" name="phone" placeholder="+243…" defaultValue={user.phone ?? ''} required /></Field>
                <Field label="Adresse complète *" hint="Quartier, avenue, point de repère"><Textarea name="address" rows={3} required /></Field>
                <div className="flex gap-2"><Button type="submit">Enregistrer</Button><Button type="button" variant="outline" onClick={() => setAddrForm(false)}>Annuler</Button></div>
              </form>
            </CardContent></Card>
          )}
          {addresses.length === 0 && !addrForm ? <Empty icon={MapPin} title="Aucune adresse enregistrée" text="Ajoutez-en une pour aller plus vite à votre prochaine commande." />
            : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{addresses.map((a) => (
              <Card key={a.id}><CardContent className="pt-5">
                <p className="flex items-center gap-2 font-semibold">{a.label} {a.isDefault && <Badge>Par défaut</Badge>}</p>
                <p className="mt-2 text-sm text-muted-foreground">{a.address}</p><p className="text-sm text-muted-foreground">{a.city} · {a.phone}</p>
                <Button variant="ghost" size="sm" className="mt-3 -ml-3 text-destructive hover:text-destructive" onClick={() => void deleteAddress(a.id)}><Trash2 />Supprimer</Button>
              </CardContent></Card>))}</div>}
        </div>
      )}

      {tab === 'profile' && (
        <Card className="max-w-2xl"><CardHeader><CardTitle>Mes informations</CardTitle><CardDescription>Ces informations sont utilisées pour vos commandes.</CardDescription></CardHeader><CardContent>
          <form className="grid gap-4" onSubmit={saveProfile} key={user.id + user.firstName + user.lastName + user.phone}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Prénom *"><Input name="firstName" defaultValue={user.firstName} required /></Field>
              <Field label="Nom *"><Input name="lastName" defaultValue={user.lastName} required /></Field>
            </div>
            <Field label="E-mail"><Input value={user.email ?? 'Aucun e-mail'} disabled readOnly /></Field>
            <Field label="Téléphone *"><Input type="tel" name="phone" defaultValue={user.phone ?? ''} placeholder="+243…" required /></Field>
            <div><Button type="submit">Enregistrer</Button></div>
          </form>
        </CardContent></Card>
      )}

      {tab === 'security' && (
        <div className="grid max-w-3xl gap-6">
          <VerifyPanel />
          <Card><CardHeader><CardTitle>Mot de passe</CardTitle><CardDescription>Après modification, vos autres appareils sont déconnectés.</CardDescription></CardHeader><CardContent>
            <form className="grid gap-4" onSubmit={changePassword}>
              <Field label="Mot de passe actuel *"><Input type="password" name="oldPassword" required /></Field>
              <Field label="Nouveau mot de passe *" hint="8 caractères minimum"><Input type="password" name="newPassword" required minLength={8} /></Field>
              <div><Button type="submit">Changer le mot de passe</Button></div>
            </form>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Appareils connectés</CardTitle></CardHeader><CardContent className="grid gap-1">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 border-b py-3 last:border-0">
                <Laptop className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1"><p className="flex flex-wrap items-center gap-1.5 text-sm font-medium"><span className="min-w-0 max-w-full truncate">{s.userAgent ?? 'Appareil inconnu'}</span>{s.current && <Badge variant="success">Cet appareil</Badge>}</p><p className="text-xs text-muted-foreground">Connecté le {fmt(s.createdAt)} · dernière activité {fmt(s.lastUsedAt)}</p></div>
                {!s.current && <Button variant="outline" size="sm" onClick={() => void revoke(s.id)}>Déconnecter</Button>}
              </div>
            ))}
          </CardContent></Card>
        </div>
      )}
    </DashboardShell>
  );
}

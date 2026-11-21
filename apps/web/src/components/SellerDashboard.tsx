'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingBag, Settings, Plus, Wallet, Percent, Clock, Boxes, Pencil, Trash2, LogOut, Crown, ShieldCheck, ExternalLink, Truck, CheckCheck, MessageCircle, MapPin, X } from 'lucide-react';
import { DEPARTMENTS, departmentName } from '@saotech/shared';
import { formatUsd, productImageUrl } from '../lib';
import { ConversationList, Thread, type Conv } from './Chat';
import { api, errorMessage, useAuth } from './AuthProvider';
import { PhotoPicker } from './PhotoPicker';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DashboardShell, Empty, Field, PageLoader, WelcomeDialog, Input, PageHeading, Select, StatCard, Table, Td, Textarea, Th, type NavGroup } from './ui';

interface Shop { rejectReason?: string | null; certified: boolean; id: string; name: string; description?: string | null; phone?: string | null; isOfficial: boolean; status: string; countryCode: string | null; city: string | null; plan: string; planName: string; planExpiresAt: string | null; commissionBps: number; maxProducts: number | null; productCount: number; pendingPlan: string | null }
interface Stats { salesUsd: number; commissionUsd: number; netUsd: number; inProgressUsd: number; pendingLines: number; deliveredLines: number }
interface SProduct { id: number; name: string; description: string; priceUsd: number; originalPriceUsd: number | null; department: string; category: string; colors: string[]; sizes: string[]; inStock: boolean; images: string[] }
interface SOrder { number: string; status: string; createdAt: string; customer: string; city: string; phone: string; address: string; totalUsd: number; commissionUsd: number; netUsd: number; items: { name: string; quantity: number; unitPriceUsd: number; color: string; size: string }[] }
const STATUS: Record<string, string> = { pending: 'En attente', confirmed: 'Confirmée', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée' };
const TONE: Record<string, 'success' | 'warning' | 'danger' | 'default'> = { pending: 'warning', confirmed: 'default', shipped: 'default', delivered: 'success', cancelled: 'danger' };
const csv = (v: FormDataEntryValue | null): string[] => String(v ?? '').split(',').map((x) => x.trim()).filter(Boolean);
const toUsd = (v: FormDataEntryValue | null): number => Math.round(Number(v) * 100) / 100;
type Tab = 'dashboard' | 'products' | 'orders' | 'messages' | 'shop';

export function SellerDashboard() {
  const router = useRouter();
  const { user, ready, logout, notify } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<SProduct[]>([]);
  const [orders, setOrders] = useState<SOrder[]>([]);
  const [form, setForm] = useState<{ open: boolean; editing: SProduct | null }>({ open: false, editing: null });
  const [promo, setPromo] = useState(false);
  const [dep, setDep] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [orderFilter, setOrderFilter] = useState('all');
  const [welcome, setWelcome] = useState(true);
  const [conv, setConv] = useState<Conv | null>(null);
  const [trackFor, setTrackFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    const s = await api<{ shop: Shop | null }>('/seller/shop');
    if (!s.ok || !s.data.shop) { router.replace('/vendeur'); return; }
    setShop(s.data.shop);
    const [p, o, st] = await Promise.all([api<{ products: SProduct[] }>('/seller/products'), api<{ orders: SOrder[] }>('/seller/orders'), api<{ stats: Stats }>('/seller/stats')]);
    if (p.ok) setProducts(p.data.products);
    if (o.ok) setOrders(o.data.orders);
    if (st.ok) setStats(st.data.stats);
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.replace('/vendeur'); return; }
    void load();
  }, [ready, user, load, router]);

  if (!ready || !user || !shop) return <PageLoader />;

  function openForm(p: SProduct | null) { setTab('products'); setForm({ open: true, editing: p }); setPromo(!!p?.originalPriceUsd); setPhotos(p?.images ?? []); setDep(p?.department ?? ''); }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = {
      name: String(f.get('name')).trim(), description: String(f.get('description')).trim(), department: f.get('department'), category: String(f.get('category')).trim(),
      priceUsd: toUsd(f.get('price')), originalPriceUsd: promo && f.get('originalPrice') ? toUsd(f.get('originalPrice')) : null,
      colors: csv(f.get('colors')), sizes: csv(f.get('sizes')), inStock: !!f.get('inStock'), images: photos,
    };
    const editing = form.editing;
    const r = await api(editing ? `/seller/products/${editing.id}` : '/seller/products', { method: editing ? 'PUT' : 'POST', body });
    if (!r.ok) return notify(r.data.code === 'validation_error' ? 'Vérifiez les champs : prix barré supérieur au prix, 5 photos maximum.' : r.data.message ?? errorMessage(r.data.code));
    setForm({ open: false, editing: null });
    await load();
    notify(editing ? 'Produit modifié' : 'Produit publié');
  }

  async function saveShop(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await api('/seller/shop', { method: 'PATCH', body: { name: String(f.get('name')).trim(), phone: String(f.get('phone') ?? '').replace(/[\s.-]/g, '') || undefined, description: String(f.get('description')).trim() } });
    if (!r.ok) return notify(r.data.message ?? errorMessage(r.data.code));
    await load();
    notify('Boutique mise à jour');
  }

  async function orderAction(number: string, action: 'confirm' | 'ship' | 'cancel') {
    if (action === 'cancel' && !window.confirm('Annuler cette commande ?')) return;
    const r = await api(`/seller/orders/${number}/${action}`, { method: 'POST' });
    if (!r.ok) return notify(r.data.message ?? errorMessage(r.data.code));
    await load();
    notify(action === 'confirm' ? 'Commande confirmée' : action === 'ship' ? 'Commande marquée comme expédiée' : 'Commande annulée');
  }

  async function savePosition(e: React.FormEvent<HTMLFormElement>, number: string) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await api(`/seller/orders/${number}/tracking`, { method: 'POST', body: { location: String(f.get('trackLocation') ?? ''), note: String(f.get('trackNote') ?? '') || undefined } });
    if (!r.ok) return notify(r.data.message ?? errorMessage(r.data.code));
    setTrackFor(null);
    notify('Position du colis mise à jour : le client la voit dans son suivi.');
  }

  async function remove(p: SProduct) {
    if (!window.confirm(`Supprimer « ${p.name} » ?`)) return;
    const r = await api(`/seller/products/${p.id}`, { method: 'DELETE' });
    if (!r.ok) return notify(errorMessage(r.data.code));
    await load();
    notify('Produit supprimé');
  }

  const ex = form.editing;
  const inStock = products.filter((p) => p.inStock).length;
  const toDo = orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length;
  const groups: NavGroup[] = [
    { items: [{ key: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard }] },
    { title: 'Ma boutique', items: [{ key: 'products', label: 'Produits', icon: Package, badge: products.length || undefined }, { key: 'orders', label: 'Commandes', icon: ShoppingBag, badge: toDo || undefined }, { key: 'messages', label: 'Messages', icon: MessageCircle }] },
    { title: 'Paramètres', items: [{ key: 'shop', label: 'Boutique et plan', icon: Settings }] },
  ];
  const planLine = `${shop.productCount} produit${shop.productCount > 1 ? 's' : ''} sur ${shop.maxProducts ?? 'illimité'}${shop.planExpiresAt ? ` · valable jusqu’au ${new Date(shop.planExpiresAt).toLocaleDateString('fr-FR')}` : ''}`;
  const cats = DEPARTMENTS.find((d) => d.slug === dep)?.categories ?? [];
  const shownOrders = orders.filter((o) => orderFilter === 'all' || o.status === orderFilter);

  return (
    <DashboardShell space="Espace vendeur" subtitle={shop.name} groups={groups} active={tab} onSelect={(k) => { setTab(k as Tab); setForm({ open: false, editing: null }); }} user={{ name: `${user.firstName} ${user.lastName}`.trim() || user.email, email: user.email }}
      topRight={<>
        <Button size="sm" onClick={() => openForm(null)}><Plus />Ajouter un produit</Button>
        <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex"><Link href="/compte">Mon compte</Link></Button>
        <Button variant="ghost" size="sm" onClick={() => void logout()}><LogOut /><span className="hidden sm:inline">Déconnexion</span></Button>
      </>}>

      {welcome && (
        <WelcomeDialog
          title={`Bienvenue, ${user.firstName || 'cher vendeur'} !`}
          text={shop.status === 'pending' ? `Votre boutique « ${shop.name} » est en cours de validation par l’équipe Mwinda Market. Vous pourrez publier vos produits dès son acceptation.` : shop.status === 'rejected' ? `Votre demande d’ouverture pour « ${shop.name} » n’a pas été acceptée. Consultez le motif dans votre tableau de bord.` : `Votre espace vendeur « ${shop.name} » est prêt. Publiez vos produits, suivez vos commandes et répondez aux questions de vos clients.`}
          onClose={() => setWelcome(false)} />
      )}
      {!shop.isOfficial && shop.status === 'pending' && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="status"><Clock className="mt-0.5 size-4 shrink-0" /><p><b>Boutique en attente de validation.</b> L’équipe Mwinda Market examine votre demande : vous serez autorisé à publier des produits dès qu’elle sera acceptée.</p></div>
      )}
      {!shop.isOfficial && shop.status === 'rejected' && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900" role="alert"><X className="mt-0.5 size-4 shrink-0" /><p><b>Votre demande de boutique a été refusée.</b>{shop.rejectReason ? ` Motif : ${shop.rejectReason}` : ''} Contactez-nous à contact@mwindamarket.com pour toute question.</p></div>
      )}
      {!shop.isOfficial && shop.status === 'suspended' && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900" role="alert"><X className="mt-0.5 size-4 shrink-0" /><p><b>Votre boutique est suspendue.</b> Contactez-nous à contact@mwindamarket.com.</p></div>
      )}

      {tab === 'messages' && (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Card className="overflow-hidden"><CardHeader><CardTitle>Questions des clients</CardTitle><CardDescription>Répondez avant la commande pour la sécuriser.</CardDescription></CardHeader>
            <div className="max-h-[480px] overflow-y-auto"><ConversationList as="seller" activeId={conv?.id} onOpen={setConv} /></div></Card>
          <Card className="overflow-hidden"><div className="border-b px-5 py-3 text-sm font-semibold">{conv ? conv.other : 'Sélectionnez une discussion'}</div>
            {conv ? <Thread key={conv.id} conversationId={conv.id} className="h-[440px]" /> : <p className="p-8 text-center text-sm text-muted-foreground">Choisissez une discussion pour lire et répondre.</p>}</Card>
        </div>
      )}

      {tab === 'dashboard' && (
        <div className="grid gap-6">
          <Card><CardContent className="flex flex-wrap items-center gap-4 pt-5">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Crown className="size-6" /></span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-lg font-semibold">{shop.name} {shop.isOfficial && <Badge>Boutique officielle</Badge>}{shop.certified && <Badge variant="success"><ShieldCheck className="mr-1 size-3" />Vendeur certifié</Badge>}</p>
              <p className="text-sm text-muted-foreground">Plan {shop.planName}{shop.isOfficial ? '' : ` · commission ${shop.commissionBps / 100} %`} · {planLine}</p>
              {!shop.certified && !shop.isOfficial && <p className="text-xs text-primary">La certification « Vendeur certifié » est incluse dans le plan Premium.</p>}
              <p className="text-xs text-muted-foreground">{shop.city ?? 'Ville non précisée'}{shop.countryCode ? ` (${shop.countryCode})` : ''}{shop.pendingPlan ? ` · demande de plan ${shop.pendingPlan} en attente de validation` : ''}</p>
            </div>
            {!shop.isOfficial && <Button asChild variant="dark"><Link href="/tarifs">Changer de plan</Link></Button>}
          </CardContent></Card>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Gains nets (livrées)" value={formatUsd(stats?.netUsd ?? 0)} icon={Wallet} />
            <StatCard label="Commission payée" value={formatUsd(stats?.commissionUsd ?? 0)} icon={Percent} />
            <StatCard label="Commandes en cours" value={formatUsd(stats?.inProgressUsd ?? 0)} icon={Clock} hint={toDo ? `${toDo} à traiter` : undefined} />
            <StatCard label="Produits en ligne" value={products.length} icon={Boxes} hint={`${inStock} en stock`} />
          </div>
          <Card>
            <CardHeader className="flex-row items-center justify-between"><CardTitle>Commandes à traiter</CardTitle><Button variant="link" size="sm" onClick={() => setTab('orders')}>Tout voir</Button></CardHeader>
            <CardContent>
              {orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length === 0 ? <p className="text-sm text-muted-foreground">Aucune commande à traiter pour le moment.</p> : orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').slice(0, 5).map((o) => (
                <div key={o.number} className="flex flex-wrap items-center gap-3 border-b py-3 last:border-0">
                  <div className="min-w-0 flex-1"><p className="text-sm font-medium">{o.number} · {o.customer}</p><p className="text-xs text-muted-foreground">{o.city} · {formatUsd(o.totalUsd)}</p></div>
                  <Badge variant={TONE[o.status]}>{STATUS[o.status]}</Badge>
                  {o.status === 'pending' ? <Button size="sm" onClick={() => void orderAction(o.number, 'confirm')}>Confirmer</Button> : <Button size="sm" onClick={() => void orderAction(o.number, 'ship')}>Expédier</Button>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'products' && (
        <div className="grid gap-5">
          {form.open ? (
            <Card className="max-w-3xl" key={ex?.id ?? 'new'}>
              <CardHeader><CardTitle>{ex ? 'Modifier le produit' : 'Ajouter un produit'}</CardTitle><CardDescription>Choisissez le rayon puis la catégorie : c’est là que vos clients trouveront l’article.</CardDescription></CardHeader>
              <CardContent>
                <form id="sellerProductForm" className="grid gap-5" onSubmit={save}>
                  <Field label="Nom du produit *"><Input name="name" defaultValue={ex?.name ?? ''} required /></Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Rayon *"><Select name="department" required value={dep} onChange={(e) => setDep(e.target.value)}>
                      <option value="" disabled>Choisir un rayon</option>
                      {DEPARTMENTS.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
                    </Select></Field>
                    <Field label="Catégorie *"><Select name="category" required defaultValue={ex?.category ?? ''} key={dep}>
                      <option value="" disabled>{dep ? 'Choisir une catégorie' : 'Choisissez d’abord un rayon'}</option>
                      {ex && ex.department === dep && !cats.includes(ex.category) && <option value={ex.category}>{ex.category}</option>}
                      {cats.map((c) => <option key={c} value={c}>{c}</option>)}
                    </Select></Field>
                  </div>
                  <Field label="Prix de vente ($) *" hint="Les clients voient aussi la valeur dans leur monnaie locale"><Input type="number" name="price" step="0.01" min="0.01" defaultValue={ex ? ex.priceUsd : ''} required /></Field>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={promo} onChange={(e) => setPromo(e.target.checked)} />🔥 Mettre ce produit en promotion</label>
                  {promo && <Field label="Prix barré ($)" hint="Doit être plus élevé que le prix de vente"><Input type="number" name="originalPrice" step="0.01" min="0" defaultValue={ex?.originalPriceUsd ?? ''} /></Field>}
                  <PhotoPicker photos={photos} onChange={setPhotos} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Couleurs" hint="Séparées par des virgules"><Input name="colors" defaultValue={ex?.colors.join(', ') ?? ''} /></Field>
                    <Field label="Capacités / tailles" hint="Séparées par des virgules"><Input name="sizes" defaultValue={ex?.sizes.join(', ') ?? ''} /></Field>
                  </div>
                  <Field label="Description *"><Textarea name="description" rows={4} defaultValue={ex?.description ?? ''} required /></Field>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="inStock" defaultChecked={ex ? ex.inStock : true} />Produit en stock</label>
                  <div className="flex gap-2"><Button type="submit">{ex ? 'Enregistrer les modifications' : 'Publier le produit'}</Button><Button type="button" variant="outline" onClick={() => setForm({ open: false, editing: null })}>Annuler</Button></div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <>
              <PageHeading description={planLine} actions={<Button onClick={() => openForm(null)}><Plus />Ajouter un produit</Button>} />
              {products.length === 0 ? <Empty icon={Package} title="Aucun produit" text="Ajoutez votre premier produit pour commencer à vendre." action={<Button onClick={() => openForm(null)}><Plus />Ajouter un produit</Button>} /> : (
                <Card className="overflow-hidden">
                  <Table>
                    <thead className="bg-muted/40"><tr><Th></Th><Th>Produit</Th><Th>Rayon</Th><Th>Prix</Th><Th>Stock</Th><Th></Th></tr></thead>
                    <tbody>{products.map((p) => (
                      <tr key={p.id}>
                        <Td><img src={productImageUrl(p.images[0], 60, 60)} alt={p.name} className="size-11 rounded-lg border object-cover" /></Td>
                        <Td><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.category}</p></Td>
                        <Td className="text-muted-foreground">{departmentName(p.department)}</Td>
                        <Td>{formatUsd(p.priceUsd)}</Td>
                        <Td><Badge variant={p.inStock ? 'success' : 'danger'}>{p.inStock ? 'En stock' : 'Rupture'}</Badge></Td>
                        <Td><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => openForm(p)}><Pencil />Modifier</Button><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => void remove(p)}><Trash2 />Supprimer</Button></div></Td>
                      </tr>))}</tbody>
                  </Table>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'orders' && (
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {[['all', 'Toutes'], ['pending', 'À confirmer'], ['confirmed', 'À expédier'], ['shipped', 'Expédiées'], ['delivered', 'Livrées'], ['cancelled', 'Annulées']].map(([k, l]) => (
              <button key={k} type="button" onClick={() => setOrderFilter(k!)} className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${orderFilter === k ? 'border-primary bg-primary/10 font-medium text-accent-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}>{l}</button>
            ))}
          </div>
          {shownOrders.length === 0 ? <Empty icon={ShoppingBag} title="Aucune commande" text="Les commandes de vos clients apparaîtront ici." /> : shownOrders.map((o) => (
            <Card key={o.number} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-5 py-3">
                <div><p className="text-sm font-semibold">Commande {o.number}</p><p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · {o.customer} · {o.city} · {o.phone}</p></div>
                <Badge variant={TONE[o.status] ?? 'default'}>{STATUS[o.status] ?? o.status}</Badge>
              </div>
              <Table>
                <thead><tr><Th>Article</Th><Th>Qté</Th><Th>Prix</Th></tr></thead>
                <tbody>{o.items.map((i, k) => <tr key={k}><Td>{i.name}{i.color ? ` — ${i.color}` : ''}{i.size ? ` — ${i.size}` : ''}</Td><Td>{i.quantity}</Td><Td>{formatUsd(i.unitPriceUsd * i.quantity)}</Td></tr>)}</tbody>
              </Table>
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <p className="text-xs text-muted-foreground">Livraison : {o.address}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm">Total <b>{formatUsd(o.totalUsd)}</b>{!shop.isOfficial && <span className="text-muted-foreground"> · commission {formatUsd(o.commissionUsd)} · net {formatUsd(o.netUsd)}</span>}</span>
                  {o.status === 'pending' && <Button size="sm" onClick={() => void orderAction(o.number, 'confirm')}><CheckCheck />Confirmer la commande</Button>}
                  {o.status === 'confirmed' && <Button size="sm" onClick={() => void orderAction(o.number, 'ship')}><Truck />Marquer comme expédiée</Button>}
                  {(o.status === 'confirmed' || o.status === 'shipped') && <Button size="sm" variant="outline" onClick={() => setTrackFor(trackFor === o.number ? null : o.number)}><MapPin />Position du colis</Button>}
                  {(o.status === 'pending' || o.status === 'confirmed') && <Button size="sm" variant="outline" onClick={() => void orderAction(o.number, 'cancel')}>Annuler</Button>}
                </div>
              </div>
              {trackFor === o.number && (
                <form className="grid gap-3 border-t bg-muted/30 px-5 py-4 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(e) => void savePosition(e, o.number)}>
                  <Input name="trackLocation" required minLength={2} maxLength={120} placeholder="Où est le colis ? (ville, dépôt…)" />
                  <Input name="trackNote" maxLength={300} placeholder="Remarque pour le client (facultatif)" />
                  <Button type="submit">Enregistrer</Button>
                </form>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === 'shop' && (
        <div className="grid max-w-3xl gap-6">
          <Card>
            <CardHeader><CardTitle>Informations de la boutique</CardTitle><CardDescription>Localisation : {shop.city ?? 'ville non précisée'}{shop.countryCode ? ` (${shop.countryCode})` : ''}</CardDescription></CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={saveShop} key={shop.name + shop.description + shop.phone}>
                <Field label="Nom de la boutique *"><Input name="name" defaultValue={shop.name} required /></Field>
                <Field label="Téléphone"><Input type="tel" name="phone" defaultValue={shop.phone ?? ''} /></Field>
                <Field label="Description"><Textarea name="description" rows={3} defaultValue={shop.description ?? ''} /></Field>
                <div><Button type="submit">Enregistrer</Button></div>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Plan {shop.planName}</CardTitle><CardDescription>{shop.isOfficial ? 'Boutique officielle : aucune commission.' : `Commission ${shop.commissionBps / 100} % · ${planLine}`}{shop.pendingPlan ? ` · demande ${shop.pendingPlan} en attente` : ''}</CardDescription></CardHeader>
            <CardContent>{!shop.isOfficial && <Button asChild><Link href="/tarifs"><ExternalLink />Voir les plans et changer</Link></Button>}</CardContent>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}

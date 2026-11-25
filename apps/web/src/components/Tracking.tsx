'use client';
import { nowLocale, useI18n } from './I18n';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, MapPin, PackageCheck, PackageSearch, Truck, X, ClipboardCheck, ShoppingBag } from 'lucide-react';
import { Header, Footer } from './Chrome';
import { api, useAuth } from './AuthProvider';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from './ui';
import { formatUsd } from '../lib';

interface Ev { kind: string; location: string | null; note: string | null; createdAt: string }
interface Shipment { shop: string; origin: { city: string | null; country: string | null }; status: string; items: string[]; currentLocation: string | null; events: Ev[] }
interface Tracking { number: string; status: string; createdAt: string; destination: { city: string; address: string }; placed: Ev | null; shipments: Shipment[] }
interface OrderLite { number: string; status: string; subtotalUsd: number; createdAt: string; items: { name: string }[] }

const STEPS = [
  { key: 'pending', label: 'Commande passée', icon: ShoppingBag },
  { key: 'confirmed', label: 'Confirmée', icon: ClipboardCheck },
  { key: 'shipped', label: 'Expédiée', icon: Truck },
  { key: 'delivered', label: 'Livrée', icon: PackageCheck },
];
const EVENT_LABEL: Record<string, string> = { placed: 'Commande passée', confirmed: 'Commande confirmée', shipped: 'Colis expédié', update: 'Mise à jour de la position', delivered: 'Colis livré', cancelled: 'Commande annulée' };
const STATUS_LABEL: Record<string, string> = { pending: 'En attente', confirmed: 'Confirmée', shipped: 'En route', delivered: 'Livrée', cancelled: 'Annulée' };
const when = (d: string) => new Date(d).toLocaleString(nowLocale(), { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

function Steps({ status }: { status: string }) {
  const idx = STEPS.findIndex((s) => s.key === status);
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Étapes de la commande">
      {STEPS.map((s, i) => {
        const done = i <= idx, current = i === idx, Icon = s.icon;
        return (
          <li key={s.key} className="relative flex flex-col items-center gap-2 text-center" aria-current={current ? 'step' : undefined}>
            {i > 0 && <span className={`absolute right-1/2 top-5 h-0.5 w-full ${i <= idx ? 'bg-primary' : 'bg-border'}`} aria-hidden />}
            <span className={`relative z-10 flex size-10 items-center justify-center rounded-full border-2 ${done ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground'} ${current ? 'ring-4 ring-primary/20' : ''}`}>
              {done && !current ? <Check className="size-5" /> : <Icon className="size-5" />}
            </span>
            <span className={`text-xs font-medium ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function ShipmentCard({ s, destination, placed }: { s: Shipment; destination: string; placed: Ev | null }) {
  const history = [...s.events, ...(placed ? [placed] : [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Vendu par {s.shop}</CardTitle>
          <Badge variant={s.status === 'cancelled' ? 'danger' : s.status === 'delivered' ? 'success' : 'secondary'}>{STATUS_LABEL[s.status]}</Badge>
        </div>
        <CardDescription>{s.items.join(' · ')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {s.status === 'cancelled'
          ? <p className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-900"><X className="size-4" /> Cette expédition a été annulée.</p>
          : <Steps status={s.status} />}
        {s.status !== 'cancelled' && (
          <div className="grid gap-3 rounded-xl bg-muted/50 p-4 sm:grid-cols-3" data-track-position>
            <div><p className="text-xs text-muted-foreground">Position actuelle</p><p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold"><MapPin className="size-4 text-primary" />{s.currentLocation ?? 'En préparation chez le vendeur'}</p></div>
            <div><p className="text-xs text-muted-foreground">Départ</p><p className="mt-0.5 text-sm font-medium">{[s.origin.city, s.origin.country].filter(Boolean).join(', ') || 'Chez le vendeur'}</p></div>
            <div><p className="text-xs text-muted-foreground">Destination</p><p className="mt-0.5 text-sm font-medium">{destination}</p></div>
          </div>
        )}
        <div>
          <h3 className="mb-3 text-sm font-semibold">Historique</h3>
          <ul className="grid gap-0">
            {history.map((e, i) => (
              <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
                {i < history.length - 1 && <span className="absolute left-[7px] top-4 h-full w-px bg-border" aria-hidden />}
                <span className={`relative z-10 mt-1 size-4 shrink-0 rounded-full border-2 ${i === 0 ? 'border-primary bg-primary' : 'border-border bg-card'}`} />
                <div className="text-sm">
                  <p className="font-medium">{EVENT_LABEL[e.kind] ?? e.kind}{e.location ? <span className="font-normal text-muted-foreground"> · {e.location}</span> : null}</p>
                  {e.note && <p className="text-muted-foreground">{e.note}</p>}
                  <p className="text-xs text-muted-foreground">{when(e.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

/** Page « Suivre ma commande » : liste des commandes du client, puis frise de suivi et position du colis par boutique. */
export function TrackingArea() {
  useI18n();
  const { user, ready, openLogin } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const number = (params.get('n') ?? '').trim().toUpperCase();
  const [orders, setOrders] = useState<OrderLite[] | null>(null);
  const [track, setTrack] = useState<Tracking | null>(null);
  const [error, setError] = useState('');
  const [typed, setTyped] = useState(number);

  useEffect(() => { setTyped(number); }, [number]);
  useEffect(() => { if (user) void api<{ orders: OrderLite[] }>('/orders').then((r) => r.ok && setOrders(r.data.orders)); }, [user]);

  const load = useCallback(async () => {
    if (!number) { setTrack(null); setError(''); return; }
    const r = await api<Tracking>(`/orders/${encodeURIComponent(number)}/tracking`);
    if (r.ok) { setTrack(r.data); setError(''); } else { setTrack(null); setError('Aucune commande de ce numéro sur votre compte.'); }
  }, [number]);
  useEffect(() => {
    if (!user) return;
    void load();
    const t = setInterval(() => { if (!document.hidden) void load(); }, 30000);
    return () => clearInterval(t);
  }, [user, load]);

  return (
    <>
      <Header active="" />
      <div className="page-header" data-theme="commande">
        <h1>Suivre ma commande</h1>
        <p>Où se trouve votre colis ? Suivez chaque étape, de la confirmation à la livraison.</p>
      </div>
      <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
        <div className="ui"><div className="mx-auto grid max-w-3xl gap-6">
          {!ready ? <p className="text-center text-sm text-muted-foreground">Chargement…</p> : !user ? (
            <Card className="text-center"><CardHeader className="items-center"><PackageSearch className="size-8 text-primary" /><CardTitle>Connectez-vous pour suivre vos commandes</CardTitle><CardDescription>Le suivi est réservé au client qui a passé la commande.</CardDescription></CardHeader>
              <CardContent><Button onClick={() => openLogin('signin')}>Se connecter</Button></CardContent></Card>
          ) : (
            <>
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); router.push(typed.trim() ? `/suivi?n=${encodeURIComponent(typed.trim())}` : '/suivi'); }}>
                <Input name="orderNumber" placeholder="Numéro de commande (ex. STM-1002)" value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="Numéro de commande" />
                <Button type="submit">Suivre</Button>
              </form>
              {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-900" role="alert">{error}</p>}
              {track ? (
                <>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-lg font-semibold">Commande {track.number}</h2>
                    <p className="text-sm text-muted-foreground">{`Passée le ${when(track.createdAt)} · livraison à ${track.destination.city}`}</p>
                  </div>
                  {track.shipments.length > 1 && <p className="text-sm text-muted-foreground">Votre commande contient des articles de {track.shipments.length} boutiques : chacune expédie séparément.</p>}
                  {track.shipments.map((s) => <ShipmentCard key={s.shop} s={s} destination={`${track.destination.city} — ${track.destination.address}`} placed={track.placed} />)}
                </>
              ) : !number && (
                <Card>
                  <CardHeader><CardTitle>Mes commandes</CardTitle><CardDescription>Choisissez la commande à suivre.</CardDescription></CardHeader>
                  <CardContent className="grid gap-2">
                    {orders === null ? <p className="text-sm text-muted-foreground">Chargement…</p> : orders.length === 0 ? <p className="text-sm text-muted-foreground">Vous n’avez pas encore de commande. <Link className="text-primary underline" href="/collection">Parcourir les produits</Link></p> : orders.map((o) => (
                      <Link key={o.number} href={`/suivi?n=${o.number}`} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm hover:bg-muted/50">
                        <span><b>{o.number}</b><span className="block text-xs text-muted-foreground">{o.items.map((i) => i.name).join(', ')}</span></span>
                        <span className="text-right"><Badge variant="secondary">{STATUS_LABEL[o.status]}</Badge><span className="mt-1 block text-xs">{formatUsd(o.subtotalUsd)}</span></span>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

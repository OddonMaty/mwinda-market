'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { formatUsd, productImageUrl } from '../lib';
import { api } from './AuthProvider';
import { compress } from './PhotoPicker';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Field, Input, Table as UTable, Td, Th } from './ui';

interface Slide {
  id: string; productId: number | null; tag: string; title: string; text: string; image: string; priceUsd: number | null; priceOverride: number | null; link: string | null;
  active: boolean; placement: 'hero' | 'home'; startsAt: string | null; endsAt: string | null; shop: string | null; plan: string | null; eligible: boolean; live: boolean; reason: string | null;
}
interface Candidate { id: number; name: string; priceUsd: number; image: string | null; shop: string; plan: string; eligible: boolean; demo: boolean }
interface Demo { demoTotal: number; demoActive: number; realActive: number }
interface P { notify: (m: string) => void; fail: (r: { data: { code?: string; message?: string } }) => void }

const REASON: Record<string, string> = { inactive: 'Désactivée', hors_periode: 'Hors période', produit_indisponible: 'Produit indisponible', boutique_inactive: 'Boutique inactive', plan_non_eligible: 'Abonnement non éligible' };

/** « Promotions » : l'administrateur choisit les produits promus (accueil, carrousel). Réservé aux vendeurs à abonnement payant. */
export function Showcase({ notify, fail }: P) {
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [demo, setDemo] = useState<Demo | null>(null);
  const [adding, setAdding] = useState<'hero' | 'home' | 'banner' | null>(null);
  const [edit, setEdit] = useState<Slide | null>(null);

  const reload = useCallback(async () => {
    const [s, d] = await Promise.all([api<{ slides: Slide[] }>('/admin/hero'), api<Demo>('/admin/demo')]);
    setSlides(s.ok ? s.data.slides : []);
    if (d.ok) setDemo(d.data);
  }, []);
  useEffect(() => { void reload(); }, [reload]);

  async function move(i: number, dir: -1 | 1) {
    if (!slides) return;
    const ids = slides.map((s) => s.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    const r = await api('/admin/hero/order', { method: 'PUT', body: { ids } });
    if (!r.ok) return fail(r);
    await reload();
  }
  async function patch(id: string, body: object, msg: string) {
    const r = await api(`/admin/hero/${id}`, { method: 'PATCH', body });
    if (!r.ok) return fail(r);
    notify(msg); await reload();
  }
  async function remove(id: string) {
    if (!window.confirm('Supprimer cette diapositive ?')) return;
    const r = await api(`/admin/hero/${id}`, { method: 'DELETE' });
    if (!r.ok) return fail(r);
    notify('Diapositive supprimée'); await reload();
  }
  async function demoAction(kind: 'hide' | 'restore') {
    if (kind === 'hide' && !window.confirm(`Retirer les ${demo?.demoActive} produits de démonstration de la boutique ? Vous pourrez les remettre en ligne.`)) return;
    const r = await api(`/admin/demo/${kind}`, { method: 'POST' });
    if (!r.ok) return fail(r);
    notify(kind === 'hide' ? 'Produits de démonstration retirés' : 'Produits de démonstration remis en ligne'); await reload();
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Promotions des produits</CardTitle>
          <CardDescription>Les vendeurs ayant choisi un abonnement payant ont droit aux promotions sur la plateforme ; c’est vous qui choisissez quels produits sont promus : dans le carrousel de l’accueil (avec un prix affiché si vous le souhaitez) ou dans la section « À la une ». Si l’abonnement d’un vendeur expire, sa promotion s’arrête toute seule.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => { setAdding('hero'); setEdit(null); }}>+ Promouvoir dans le carrousel</Button>
            <Button type="button" variant="outline" onClick={() => { setAdding('home'); setEdit(null); }}>+ Promouvoir « À la une »</Button>
            <Button type="button" variant="outline" onClick={() => { setAdding('banner'); setEdit(null); }}>+ Bannière libre</Button>
          </div>
          {slides && slides.length === 0 && <p className="text-sm text-muted-foreground">Aucune promotion : l’accueil affiche une bannière de présentation de la marque.</p>}
          <div className="grid gap-3">
            {slides?.map((s, i) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border p-3">
                <img src={productImageUrl(s.image, 160, 72)} alt="" className="h-[54px] w-32 rounded-lg bg-muted object-cover" loading="lazy" />
                <div className="min-w-0 flex-1 basis-48">
                  <p className="truncate font-medium">{s.title || '(sans titre)'} {s.tag && <span className="text-xs text-muted-foreground">· {s.tag}</span>}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {s.productId ? `Produit #${s.productId} · ${s.shop} · ${s.plan}` : 'Bannière libre'} · {s.priceUsd != null ? formatUsd(s.priceUsd) : 'sans prix'}{s.priceOverride != null ? ' (prix imposé)' : ''}
                  </p>
                </div>
                <Badge variant="outline">{s.placement === 'home' ? 'À la une' : 'Carrousel'}</Badge>
                {s.live ? <Badge variant="success">En ligne</Badge> : <Badge variant={s.reason === 'plan_non_eligible' ? 'danger' : 'secondary'}>{REASON[s.reason ?? ''] ?? 'Hors ligne'}</Badge>}
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="sm" aria-label="Monter" disabled={i === 0} onClick={() => void move(i, -1)}><ArrowUp className="size-4" /></Button>
                  <Button type="button" variant="ghost" size="sm" aria-label="Descendre" disabled={i === slides.length - 1} onClick={() => void move(i, 1)}><ArrowDown className="size-4" /></Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void patch(s.id, { active: !s.active }, s.active ? 'Diapositive désactivée' : 'Diapositive activée')}>{s.active ? 'Désactiver' : 'Activer'}</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setEdit(s); setAdding(null); }}>Modifier</Button>
                  <Button type="button" variant="ghost" size="sm" aria-label="Supprimer" onClick={() => void remove(s.id)}><Trash2 className="size-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {(adding === 'hero' || adding === 'home') && <ProductPicker placement={adding} notify={notify} fail={fail} onDone={() => { setAdding(null); void reload(); }} />}
      {adding === 'banner' && <SlideForm key="new-banner" notify={notify} fail={fail} onDone={() => { setAdding(null); void reload(); }} />}
      {edit && <SlideForm key={edit.id} slide={edit} notify={notify} fail={fail} onDone={() => { setEdit(null); void reload(); }} />}

      <Card>
        <CardHeader>
          <CardTitle>Produits de démonstration</CardTitle>
          <CardDescription>Les produits d’exemple fournis au lancement (boutique officielle). Quand les vrais produits des vendeurs sont en ligne, retirez-les en un clic ; ils sont archivés, pas supprimés.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          {demo && <p className="text-sm">{demo.demoActive} produit{demo.demoActive > 1 ? 's' : ''} de démonstration en ligne · {demo.realActive} produit{demo.realActive > 1 ? 's' : ''} réel{demo.realActive > 1 ? 's' : ''} en ligne</p>}
          {demo && demo.demoActive > 0 && <Button type="button" variant="destructive" onClick={() => void demoAction('hide')}>Retirer les produits de démonstration</Button>}
          {demo && demo.demoActive === 0 && demo.demoTotal > 0 && <Button type="button" variant="outline" onClick={() => void demoAction('restore')}>Remettre les produits de démonstration</Button>}
        </CardContent>
      </Card>
    </div>
  );
}

function ProductPicker({ placement, notify, fail, onDone }: P & { placement: 'hero' | 'home'; onDone: () => void }) {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Candidate[] | null>(null);
  useEffect(() => {
    const t = setTimeout(() => { void api<{ products: Candidate[] }>(`/admin/hero/candidates?q=${encodeURIComponent(q)}`).then((r) => setRows(r.ok ? r.data.products : [])); }, 250);
    return () => clearTimeout(t);
  }, [q]);
  async function pick(c: Candidate) {
    const r = await api('/admin/hero', { method: 'POST', body: { productId: c.id, tag: 'À la une', placement } });
    if (!r.ok) return fail(r);
    notify('Promotion ajoutée'); onDone();
  }
  return (
    <Card>
      <CardHeader><CardTitle>{placement === 'home' ? 'Promouvoir « À la une »' : 'Promouvoir dans le carrousel'}</CardTitle><CardDescription>Seuls les produits de la boutique officielle ou d’un vendeur à abonnement payant peuvent être promus ; ils sont en tête de liste.</CardDescription></CardHeader>
      <CardContent className="grid gap-3">
        <Input placeholder="Rechercher un produit…" value={q} onChange={(e) => setQ(e.target.value)} />
        <UTable>
          <thead><tr><Th>Produit</Th><Th>Boutique</Th><Th>Abonnement</Th><Th>Prix</Th><Th>{' '}</Th></tr></thead>
          <tbody>
            {rows?.map((c) => (
              <tr key={c.id}>
                <Td>{c.name} {c.demo && <Badge variant="secondary">Démo</Badge>}</Td><Td>{c.shop}</Td>
                <Td><Badge variant={c.eligible ? 'success' : 'secondary'}>{c.plan}{c.eligible ? '' : ' · gratuit, non éligible'}</Badge></Td><Td>{formatUsd(c.priceUsd)}</Td>
                <Td className="text-right"><Button type="button" size="sm" variant="outline" disabled={!c.eligible} onClick={() => void pick(c)}>Ajouter</Button></Td>
              </tr>
            ))}
          </tbody>
        </UTable>
        {rows?.length === 0 && <p className="text-sm text-muted-foreground">Aucun produit trouvé.</p>}
        <div><Button type="button" variant="outline" onClick={onDone}>Fermer</Button></div>
      </CardContent>
    </Card>
  );
}

function SlideForm({ slide, notify, fail, onDone }: P & { slide?: Slide; onDone: () => void }) {
  const [image, setImage] = useState(slide?.image ?? '');
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const linked = slide?.productId != null;

  async function upload(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    try {
      const r = await api<{ url: string }>('/admin/images', { method: 'POST', body: { data: await compress(f, 1600) } });
      if (r.ok) setImage(r.data.url); else fail(r);
    } catch { notify('Image illisible : utilisez une photo JPEG, PNG ou WebP.'); }
    setBusy(false);
  }
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const price = String(f.get('price') ?? '').trim();
    const link = String(f.get('link') ?? '').trim();
    const dt = (k: string) => { const v = String(f.get(k) ?? ''); return v ? new Date(v).toISOString() : null; };
    const body = {
      tag: String(f.get('tag') ?? '').trim(), title: String(f.get('title') ?? '').trim(), text: String(f.get('text') ?? '').trim(),
      image, priceUsd: price ? Number(price) : null, link: link || null, startsAt: dt('startsAt'), endsAt: dt('endsAt'),
    };
    const r = slide ? await api(`/admin/hero/${slide.id}`, { method: 'PATCH', body }) : await api('/admin/hero', { method: 'POST', body });
    if (!r.ok) return fail(r);
    notify('Diapositive enregistrée'); onDone();
  }
  const local = (d: string | null) => (d ? new Date(new Date(d).getTime() - new Date(d).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
  return (
    <Card>
      <CardHeader><CardTitle>{slide ? 'Modifier la promotion' : 'Nouvelle bannière'}</CardTitle>
        <CardDescription>{linked ? 'Laissez un champ vide pour reprendre automatiquement le titre, la photo et le prix du produit.' : 'Une bannière libre n’est liée à aucun produit : indiquez un titre, une image et, si besoin, un lien.'}</CardDescription></CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={(e) => void save(e)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Étiquette"><Input name="tag" maxLength={40} defaultValue={slide?.tag ?? ''} placeholder="Nouveauté, Offre limitée…" /></Field>
            <Field label={linked ? 'Titre' : 'Titre *'}><Input name="title" maxLength={120} defaultValue={slide?.title ?? ''} required={!linked} /></Field>
            <Field label="Prix affiché ($)" hint={linked ? 'Vide = prix actuel du produit' : 'Vide = pas de prix'}><Input type="number" name="price" step="0.01" min="0.01" defaultValue={slide?.priceOverride ?? ''} /></Field>
            <Field label="Lien" hint={linked ? 'Vide = fiche du produit' : 'Ex. /collection ou https://…'}><Input name="link" maxLength={300} defaultValue={slide?.link ?? ''} /></Field>
            <Field label="Début de diffusion"><Input type="datetime-local" name="startsAt" defaultValue={local(slide?.startsAt ?? null)} /></Field>
            <Field label="Fin de diffusion"><Input type="datetime-local" name="endsAt" defaultValue={local(slide?.endsAt ?? null)} /></Field>
          </div>
          <Field label="Texte"><Input name="text" maxLength={300} defaultValue={slide?.text ?? ''} /></Field>
          <div className="grid gap-2">
            <p className="text-sm font-medium">Image {linked ? '' : '*'} <span className="font-normal text-muted-foreground">— format large, idéalement 1400 × 600</span></p>
            {image && <img src={productImageUrl(image, 420, 180)} alt="" className="h-28 w-64 rounded-lg border object-cover" />}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={() => file.current?.click()}>{busy ? 'Envoi…' : image ? 'Changer l’image' : 'Envoyer une image'}</Button>
              {image && linked && <Button type="button" variant="ghost" onClick={() => setImage('')}>Reprendre la photo du produit</Button>}
            </div>
            <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/*" hidden onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
          <div className="flex gap-2"><Button type="submit" disabled={busy || (!linked && !image)}>Enregistrer</Button><Button type="button" variant="outline" onClick={onDone}>Annuler</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}

'use client';

import { countryName } from '../i18n/translate';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Globe2, Smartphone, Store, Users } from 'lucide-react';
import { api, errorMessage, useAuth } from './AuthProvider';
import { useI18n, useT } from './I18n';
import { e164 } from './CheckoutArea';
import { useCountries } from './Geo';
import { PlanCards, type Plan } from './PlanCards';
import { Header, Footer } from './Chrome';
import { Button, PageLoader, Card, CardContent, CardDescription, CardHeader, CardTitle, Field, Input, Select, Textarea, cn } from './ui';

const STEPS = ['Votre boutique', 'Votre plan', 'Votre compte'];

/** Ouverture de boutique en 3 étapes : boutique (pays et ville) → plan → compte. Une boutique déjà connecté saute l'étape compte. */
export function SellerArea() {
  const router = useRouter();
  const t = useT();
  const { lang } = useI18n();
  const { user, ready, notify, refresh } = useAuth();
  const countries = useCountries();
  const [mode, setMode] = useState<'open' | 'login'>('open');
  const [step, setStep] = useState(0);
  const [hasShop, setHasShop] = useState<boolean | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plan, setPlan] = useState('free');
  const [shop, setShop] = useState({ name: '', description: '', phone: '', country: 'CD', city: '', owner: '' });
  const [busy, setBusy] = useState(false);
  const country = countries.find((c) => c.code === shop.country);
  const last = user ? 1 : 2;

  useEffect(() => { void api<{ plans: Plan[] }>('/plans').then((r) => r.ok && setPlans(r.data.plans)); }, []);
  useEffect(() => {
    if (!user) { setHasShop(null); return; }
    setShop((s) => ({ ...s, phone: s.phone || user.phone || '', country: user.countryCode ?? s.country }));
    void api<{ shop: unknown }>('/seller/shop').then((r) => {
      if (r.ok && r.data.shop) router.replace('/vendeur/tableau');
      else setHasShop(false);
    });
  }, [user, router]);

  const set = (k: keyof typeof shop) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setShop((s) => ({ ...s, [k]: e.target.value, ...(k === 'country' ? { city: '' } : {}) }));

  async function createShopAndPlan(): Promise<boolean> {
    const r = await api('/seller/shop', { method: 'POST', body: { name: shop.name.trim(), phone: e164(shop.phone), whatsapp: e164(shop.phone), description: shop.description.trim() || undefined, countryCode: shop.country, citySlug: shop.city || undefined } });
    if (!r.ok) { notify(r.data.code === 'shop_exists' ? 'Vous avez déjà une boutique.' : r.data.message ?? errorMessage(r.data.code)); return false; }
    if (plan !== 'free') {
      const p = await api('/seller/plan', { method: 'POST', body: { plan } });
      if (p.ok) notify('Boutique créée. Votre demande de plan est envoyée : il sera activé après validation du paiement.');
      else notify('Boutique créée, mais la demande de plan a échoué : refaites-la depuis Tarifs.');
    } else notify('Boutique créée !');
    return true;
  }

  function next(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < last) { setStep(step + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      if (user) {
        if (await createShopAndPlan()) { await refresh(); router.push('/vendeur/tableau'); }
        return;
      }
      const f = new FormData(e.currentTarget);
      const email = String(f.get('email') ?? '').trim(); const password = String(f.get('password'));
      const [first, ...rest] = shop.owner.trim().split(/\s+/);
      const reg = await api('/auth/register', { method: 'POST', body: { email: email || undefined, password, firstName: first, lastName: rest.join(' ') || first, phone: e164(shop.phone), countryCode: shop.country, citySlug: shop.city || undefined, locale: 'fr' } });
      if (!reg.ok) return notify(errorMessage(reg.data.code));
      const log = await api('/auth/login', { method: 'POST', body: { identifier: email || e164(shop.phone), password, client: 'web' } });
      if (!log.ok) return notify('Un compte existe déjà avec cet identifiant : connectez-vous avec votre mot de passe.');
      if (!(await createShopAndPlan())) { await refresh(); return; }
      await refresh();
      router.push('/vendeur/tableau');
    } finally { setBusy(false); }
  }

  async function onLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await api('/auth/login', { method: 'POST', body: { identifier: String(f.get('identifier') ?? '').trim(), password: f.get('password'), client: 'web' } });
    if (!r.ok) return notify(errorMessage(r.data.code));
    await refresh();
    notify('Connexion réussie !');
  }

  // Une boutique déjà connecté est redirigé vers sa boutique : on n'affiche jamais la page de présentation, seulement le chargement.
  if (!ready || (user && (hasShop === null || hasShop))) return <PageLoader />;
  const chosen = plans.find((p) => p.code === plan);
  const stepsShown = user ? STEPS.slice(0, 2) : STEPS;

  return (
    <>
    <Header active="" />
    <div className="page-header" data-theme="boutique">
      <h1>{t('Ouvrez votre boutique sur Mwinda Market')}</h1>
      <p>Ouvrez votre boutique en ligne et vendez vos produits à des milliers de clients, dans votre pays et partout en Afrique.</p>
    </div>
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
    <div className="ui mx-auto grid w-full max-w-6xl gap-8 py-2 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="hidden content-start gap-6 lg:grid">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Pourquoi vendre sur Mwinda Market ?</h2>
          <p className="mt-2 text-sm text-muted-foreground">Une marketplace pensée pour les commerçants africains.</p>
        </div>
        {[[Users, 'Une audience déjà là', 'Touchez des milliers de clients dans votre pays et partout en Afrique.'], [Smartphone, 'Paiements Mobile Money', 'Vos clients paient comme ils en ont déjà l’habitude.'], [Store, 'Votre propre boutique', 'Ajoutez, modifiez et suivez vos produits et commandes en quelques clics.'], [Globe2, 'Votre pays, votre ville', 'Choisissez votre pays et votre ville : vos clients vous trouvent près de chez eux.']].map(([Icon, t, s]) => {
          const I = Icon as typeof Users;
          return <div key={t as string} className="flex gap-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><I className="size-5" /></span><div><p className="font-medium">{t as string}</p><p className="text-sm text-muted-foreground">{s as string}</p></div></div>;
        })}
      </div>

      <Card className="self-start">
        {mode === 'login' && !user ? (
          <>
            <CardHeader><CardTitle>{t('Se connecter à ma boutique')}</CardTitle><CardDescription>Accédez à votre espace boutique.</CardDescription></CardHeader>
            <CardContent>
              <form id="sellerLoginForm" className="grid gap-4" onSubmit={onLogin}>
                <Field label={t('Numéro WhatsApp ou e-mail *')}><Input type="text" name="identifier" placeholder="+243… ou vendeur@email.com" required /></Field>
                <Field label={t('Mot de passe *')}><Input type="password" name="password" required /></Field>
                <Button type="submit" size="lg">{t('Se connecter')}</Button>
                <button type="button" className="text-sm text-primary hover:underline" onClick={() => setMode('open')}>Pas encore de boutique ? Ouvrir ma boutique</button>
              </form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-xl">{t('Ouvrir ma boutique')}</CardTitle>
              <ol className="mt-3 flex items-center gap-2 text-xs">
                {stepsShown.map((s, i) => (
                  <li key={s} className="flex items-center gap-2">
                    <span className={cn('flex size-6 items-center justify-center rounded-full border font-semibold', i < step ? 'border-primary bg-primary text-primary-foreground' : i === step ? 'border-primary text-primary' : 'text-muted-foreground')}>{i < step ? <Check className="size-3.5" /> : i + 1}</span>
                    <span className={cn('hidden sm:inline', i === step ? 'font-medium' : 'text-muted-foreground')}>{t(s)}</span>
                    {i < stepsShown.length - 1 && <span className="mx-1 h-px w-6 bg-border" />}
                  </li>
                ))}
              </ol>
            </CardHeader>
            <CardContent>
              <form id="sellerRegisterForm" className="grid gap-4" onSubmit={step < last ? next : submit}>
                <div className={cn('grid gap-4', step !== 0 && 'hidden')}>
                  <Field label={t('Nom de la boutique *')}><Input name="shopName" value={shop.name} onChange={set('name')} placeholder="Ex. TechPlus" required /></Field>
                  {!user && <Field label={t('Votre nom complet *')}><Input name="ownerName" value={shop.owner} onChange={set('owner')} required /></Field>}
                  <Field label={t('Numéro WhatsApp *')} hint={t('Avec l’indicatif du pays — vous y recevrez les nouvelles commandes, même sans e-mail')}><Input type="tel" name="phone" value={shop.phone} onChange={set('phone')} placeholder={`${country?.phonePrefix ?? '+243'} …`} required /></Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t('Pays *')}><Select name="country" value={shop.country} onChange={set('country')} required>
                      {countries.length === 0 && <option value={shop.country}>Chargement…</option>}
                      {countries.map((c) => <option key={c.code} value={c.code}>{countryName(lang, c.name, c.code)}</option>)}
                    </Select></Field>
                    <Field label={t('Ville')}><Select name="city" value={shop.city} onChange={set('city')} key={shop.country}>
                      <option value="">{country?.cities.length ? 'Autre ville' : 'Ville non listée'}</option>
                      {country?.cities.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                    </Select></Field>
                  </div>
                  <Field label="Description" hint="Optionnel — présentez votre boutique en une phrase"><Textarea name="description" rows={2} value={shop.description} onChange={set('description')} /></Field>
                </div>

                <div className={cn('grid gap-4', step !== 1 && 'hidden')}>
                  <p className="text-sm text-muted-foreground">Choisissez le plan qui correspond à votre activité. Vous pourrez en changer à tout moment.</p>
                  <PlanCards plans={plans} selected={plan} onSelect={setPlan} className="sm:grid-cols-2 xl:grid-cols-2" />
                  {plan !== 'free' && <p className="rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground">{`Votre boutique démarre en plan Gratuit. Le plan ${chosen?.name} sera activé pour 3 mois dès que notre équipe aura validé le paiement de l’abonnement.`}</p>}
                </div>

                {!user && (
                  <div className={cn('grid gap-4', step !== 2 && 'hidden')}>
                    <Field label={t('Adresse e-mail')} hint={t('Facultatif — sans e-mail, vous vous connectez avec votre numéro WhatsApp et recevez vos alertes dessus')}><Input type="email" name="email" placeholder="vendeur@email.com" /></Field>
                    <Field label={t('Mot de passe *')} hint={t('8 caractères minimum')}><Input type="password" name="password" minLength={8} required={step === 2} /></Field>
                    <div className="rounded-xl bg-muted/60 p-3 text-sm"><b>Récapitulatif :</b> {shop.name || 'Votre boutique'} · {country ? countryName(lang, country.name, country.code) : ''}{shop.city ? ` · ${country?.cities.find((c) => c.slug === shop.city)?.name}` : ''} {`· plan ${chosen?.name}`}</div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1">
                  {step > 0 ? <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>{t('Retour')}</Button> : !user ? <button type="button" className="text-sm text-primary hover:underline" onClick={() => setMode('login')}>{t('J’ai déjà une boutique')}</button> : <span />}
                  <Button type="submit" size="lg" disabled={busy}>{t(step < last ? 'Continuer' : 'Créer ma boutique')}</Button>
                </div>
                {!user && step === 0 && <p className="text-center text-xs text-muted-foreground">En continuant, vous acceptez les <Link href="/conditions-vendeur" className="text-primary hover:underline">conditions boutique</Link>.</p>}
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
    </div>
    <Footer />
    </>
  );
}

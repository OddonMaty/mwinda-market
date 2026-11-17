'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, errorMessage, useAuth } from './AuthProvider';
import { e164 } from './CheckoutArea';

const CITY_SLUGS: Record<string, string | undefined> = { Bukavu: 'bukavu', Uvira: 'uvira', Goma: 'goma', Baraka: 'baraka', Autre: undefined };
const CITY_OPTIONS = (
  <>
    <option value="Bukavu">Bukavu</option><option value="Uvira">Uvira</option><option value="Goma">Goma</option>
    <option value="Baraka">Baraka (territoire de Fizi)</option><option value="Autre">Autre</option>
  </>
);

export function SellerArea() {
  const router = useRouter();
  const { user, ready, notify, refresh } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [hasShop, setHasShop] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setHasShop(null); return; }
    void api<{ shop: unknown }>('/seller/shop').then((r) => {
      if (r.ok && r.data.shop) router.replace('/vendeur/tableau');
      else setHasShop(false);
    });
  }, [user, router]);

  async function createShop(f: FormData): Promise<boolean> {
    const r = await api('/seller/shop', { method: 'POST', body: { name: String(f.get('shopName')).trim(), phone: e164(f.get('phone')), citySlug: CITY_SLUGS[String(f.get('city'))] } });
    if (!r.ok) { notify(r.data.code === 'shop_exists' ? 'Vous avez déjà une boutique.' : errorMessage(r.data.code)); return false; }
    return true;
  }

  async function onLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await api('/auth/login', { method: 'POST', body: { email: f.get('email'), password: f.get('password'), client: 'web' } });
    if (!r.ok) return notify(errorMessage(r.data.code));
    await refresh();
    notify('Connexion réussie !');
  }

  async function onRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const [first, ...rest] = String(f.get('ownerName')).trim().split(/\s+/);
    const email = f.get('email');
    const password = f.get('password');
    const reg = await api('/auth/register', { method: 'POST', body: { email, password, firstName: first, lastName: rest.join(' ') || first, phone: e164(f.get('phone')), countryCode: 'CD', citySlug: CITY_SLUGS[String(f.get('city'))], locale: 'fr' } });
    if (!reg.ok) return notify(errorMessage(reg.data.code));
    const log = await api('/auth/login', { method: 'POST', body: { email, password, client: 'web' } });
    if (!log.ok) return notify('Un compte existe déjà avec cet e-mail : connectez-vous avec votre mot de passe.');
    if (!(await createShop(f))) { await refresh(); return; }
    await refresh();
    notify('Boutique créée !');
    router.push('/vendeur/tableau');
  }

  async function onCreateShopOnly(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (await createShop(new FormData(e.currentTarget))) { notify('Boutique créée !'); router.push('/vendeur/tableau'); }
  }

  if (!ready || (user && hasShop === null)) return <p className="empty-collection">Chargement…</p>;

  return (
    <div className="seller-landing">
      <div className="seller-pitch">
        <h2>Pourquoi vendre sur Sao Tech Market ?</h2>
        <div className="seller-pitch-item"><i className="fas fa-users" /><div><p className="usp-title">Une audience déjà là</p><p className="usp-sub">Touchez des milliers de clients à Bukavu, Uvira et dans tout le Sud-Kivu.</p></div></div>
        <div className="seller-pitch-item"><i className="fas fa-mobile-alt" /><div><p className="usp-title">Paiements Mobile Money</p><p className="usp-sub">Vos clients paient comme ils en ont déjà l&apos;habitude.</p></div></div>
        <div className="seller-pitch-item"><i className="fas fa-store" /><div><p className="usp-title">Votre propre boutique</p><p className="usp-sub">Ajoutez, modifiez et supprimez vos produits en quelques clics, à tout moment.</p></div></div>
      </div>

      <div className="seller-auth-card">
        {user ? (
          <>
            <h2 style={{ marginBottom: '1rem' }}>Créer ma boutique</h2>
            <form onSubmit={onCreateShopOnly}>
              <div className="form-group"><label>Nom de la boutique *</label><input type="text" name="shopName" placeholder="Ex. TechPlus Bukavu" required /></div>
              <div className="form-group"><input type="tel" name="phone" placeholder="Téléphone (+243...)" defaultValue={user.phone ?? ''} required /></div>
              <div className="form-group"><label>Ville</label><select name="city" defaultValue="Bukavu">{CITY_OPTIONS}</select></div>
              <button type="submit" className="btn btn-primary full-width">Créer ma boutique vendeur</button>
            </form>
          </>
        ) : (
          <>
            <div className="modal-tabs">
              <button type="button" className={`modal-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>Se connecter</button>
              <button type="button" className={`modal-tab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>Créer ma boutique</button>
            </div>
            <form id="sellerLoginForm" className={`form-content${tab === 'login' ? ' active' : ''}`} onSubmit={onLogin}>
              <div className="form-group"><label>Adresse e-mail *</label><input type="email" name="email" placeholder="vendeur@email.com" required /></div>
              <div className="form-group"><label>Mot de passe *</label><input type="password" name="password" placeholder="••••••••" required /></div>
              <button type="submit" className="btn btn-primary full-width">Se connecter à ma boutique</button>
            </form>
            <form id="sellerRegisterForm" className={`form-content${tab === 'register' ? ' active' : ''}`} onSubmit={onRegister}>
              <div className="form-group"><label>Nom de la boutique *</label><input type="text" name="shopName" placeholder="Ex. TechPlus Bukavu" required /></div>
              <div className="form-row"><input type="text" name="ownerName" placeholder="Votre nom complet *" required /><input type="tel" name="phone" placeholder="Téléphone (+243...)" required /></div>
              <div className="form-group"><label>Adresse e-mail *</label><input type="email" name="email" placeholder="vendeur@email.com" required /></div>
              <div className="form-group"><label>Ville</label><select name="city" defaultValue="Bukavu">{CITY_OPTIONS}</select></div>
              <div className="form-group"><label>Mot de passe *</label><input type="password" name="password" placeholder="••••••••" required minLength={8} /></div>
              <p className="seller-form-note">Vos informations sont enregistrées de façon sécurisée sur le serveur de Sao Tech Market (mot de passe chiffré).</p>
              <button type="submit" className="btn btn-primary full-width">Créer ma boutique vendeur</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

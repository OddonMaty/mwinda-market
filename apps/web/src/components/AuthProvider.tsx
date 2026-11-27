'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GeoFields } from './Geo';
import { trNow, useI18n, useT } from './I18n';

export interface SessionUser {
  id: string;
  email: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  verified: boolean;
  firstName: string;
  lastName: string;
  phone: string | null;
  countryCode: string | null;
  cityId: string | null;
  locale: string;
  roles: string[];
}

interface Ctx {
  user: SessionUser | null;
  ready: boolean;
  openLogin: (tab?: 'signin' | 'register', redirectTo?: string) => void;
  accountClick: () => void;
  logout: () => Promise<void>;
  notify: (message: string) => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<Ctx | null>(null);
export const useAuth = (): Ctx => {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth hors AuthProvider');
  return c;
};

/** Appel de l'API (même origine, cookie de session httpOnly). */
export async function api<T = unknown>(path: string, init?: { method?: string; body?: unknown }): Promise<{ ok: boolean; status: number; data: T & { code?: string; message?: string } }> {
  const res = await fetch(`/api/v1${path}`, {
    method: init?.method ?? 'GET',
    credentials: 'same-origin',
    headers: init?.body ? { 'content-type': 'application/json' } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const raw = (await res.json().catch(() => ({}))) as T & { error?: { code?: string; message?: string } };
  const data = { ...raw, code: raw.error?.code, message: raw.error?.message } as T & { code?: string; message?: string };
  return { ok: res.ok, status: res.status, data };
}

const ERRORS: Record<string, string> = {
  invalid_credentials: 'Identifiant ou mot de passe incorrect.',
  account_exists: 'Un compte existe déjà avec ce numéro. Connectez-vous.',
  phone_taken: 'Ce numéro est déjà utilisé par un autre compte.',
  invalid_code: 'Code incorrect ou expiré.',
  channel_unavailable: 'Ce canal d’envoi n’est pas encore disponible.',
  send_failed: 'Envoi impossible pour le moment. Réessayez.',
  already_verified: 'Déjà vérifié.',
  too_many_requests: 'Trop de tentatives. Réessayez dans quelques minutes.',
  validation_error: 'Vérifiez les informations saisies (téléphone au format international, par exemple +243…).',
  account_suspended: 'Ce compte est suspendu.',
  wrong_password: 'Mot de passe actuel incorrect.',
  invalid_token: 'Ce lien est invalide.',
  token_used: 'Ce lien a déjà été utilisé.',
  token_expired: 'Ce lien a expiré.',
};
export const errorMessage = (code?: string): string =>
  ERRORS[code ?? ''] ?? (code?.startsWith('weak_password') ? 'Mot de passe trop faible (8 caractères minimum, pas trop courant).' : 'Une erreur est survenue. Réessayez.');


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const t = useT();
  const { lang } = useI18n();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'signin' | 'register'>('signin');
  const [toasts, setToasts] = useState<{ id: number; text: string; out: boolean }[]>([]);
  const nextId = useRef(1);
  const redirect = useRef<string | null>(null);
  const [googleOn, setGoogleOn] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await api<{ user: SessionUser }>('/auth/me');
      setUser(r.ok ? r.data.user : null);
    } catch {
      setUser(null);
    }
    setReady(true);
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { void api<{ google: boolean }>('/auth/providers').then((r) => setGoogleOn(r.ok && r.data.google)); }, []);

  const notify = useCallback((text: string) => {
    const id = nextId.current++;
    setToasts((l) => [...l, { id, text: trNow(text), out: false }]);
    setTimeout(() => setToasts((l) => l.map((x) => (x.id === id ? { ...x, out: true } : x))), 3000);
    setTimeout(() => setToasts((l) => l.filter((x) => x.id !== id)), 3300);
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const g = p.get('google');
    if (!g) return;
    notify(g === 'annule' ? 'Connexion Google annulée.' : g === 'suspendu' ? 'Ce compte est suspendu.' : 'La connexion avec Google a échoué. Réessayez ou utilisez votre e-mail.');
    p.delete('google');
    window.history.replaceState(null, '', `${window.location.pathname}${p.size ? `?${p}` : ''}`);
  }, [notify]);

  const openLogin = useCallback((t: 'signin' | 'register' = 'signin', redirectTo?: string) => { redirect.current = redirectTo ?? null; setTab(t); setOpen(true); }, []);
  const accountClick = useCallback(() => { if (user) router.push('/compte'); else openLogin('signin'); }, [user, router, openLogin]);

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' });
    setUser(null);
    notify('Vous êtes déconnecté');
    router.push('/');
  }, [notify, router]);

  async function onSignin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await api('/auth/login', { method: 'POST', body: { identifier: String(f.get('identifier') ?? '').trim(), password: f.get('password'), client: 'web' } });
    if (!r.ok) return notify(errorMessage(r.data.code));
    await refresh();
    setOpen(false);
    notify('Connexion réussie !');
    if (redirect.current) { router.push(redirect.current); redirect.current = null; }
  }

  async function onRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await api('/auth/register', {
      method: 'POST',
      body: {
        email: String(f.get('email') ?? '').trim() || undefined, password: f.get('password'), firstName: f.get('firstName'), lastName: f.get('lastName'),
        phone: String(f.get('phone') ?? '').replace(/[\s.-]/g, ''), countryCode: f.get('country'), citySlug: f.get('city') || undefined, locale: lang,
      },
    });
    if (!r.ok) return notify(errorMessage(r.data.code));
    form.reset();
    setTab('signin');
    notify(f.get('email') ? 'Compte créé ! Connectez-vous. Vous pourrez vérifier votre compte plus tard (facultatif).' : 'Compte créé ! Connectez-vous avec votre numéro.');
  }

  return (
    <AuthContext.Provider value={{ user, ready, openLogin, accountClick, logout, notify, refresh }}>
      {children}

      <div id="loginModal" className={`modal${open ? ' active' : ''}`}>
        <div className="modal-overlay" onClick={() => setOpen(false)} />
        <div className="modal-content">
          <button type="button" className="modal-close" onClick={() => setOpen(false)}><i className="fas fa-times" /></button>
          <div className="modal-tabs">
            <button type="button" className={`modal-tab${tab === 'signin' ? ' active' : ''}`} onClick={() => setTab('signin')}>{t('Connexion')}</button>
            <button type="button" className={`modal-tab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>{t('Inscription')}</button>
          </div>
          <form id="signinForm" className={`form-content${tab === 'signin' ? ' active' : ''}`} onSubmit={onSignin}>
            <div className="form-group"><label>{t('E-mail ou numéro de téléphone *')}</label><input type="text" name="identifier" placeholder={t('votre@email.com ou +243…')} autoComplete="username" required /></div>
            <div className="form-group"><label>{t('Mot de passe *')}</label><input type="password" name="password" placeholder="••••••••" required /></div>
            <button type="submit" className="btn btn-primary full-width">{t('Se connecter')}</button>
            {googleOn && <GoogleButton next={redirect.current} />}
            <div className="form-footer" style={{ marginTop: '1rem', marginBottom: 0 }}>
              <Link href="/mot-de-passe-oublie" className="link-btn" onClick={() => setOpen(false)}>{t('Mot de passe oublié ?')}</Link>
            </div>
          </form>
          <form id="registerForm" className={`form-content${tab === 'register' ? ' active' : ''}`} onSubmit={onRegister}>
            <div className="form-row"><input type="text" name="firstName" placeholder={t('Prénom *')} required /><input type="text" name="lastName" placeholder={t('Nom *')} required /></div>
            <div className="form-group"><input type="tel" name="phone" placeholder={t('Téléphone avec indicatif (+243...) *')} required /></div>
            <div className="form-group"><input type="email" name="email" placeholder={t('E-mail (facultatif)')} /></div>
            <GeoFields label={false} />
            <div className="form-group"><label>{t('Mot de passe *')}</label><input type="password" name="password" placeholder="••••••••" required minLength={8} /></div>
            <label className="checkbox-label"><input type="checkbox" name="newsletter" /><span>{t("S'abonner à notre newsletter")}</span></label>
            <button type="submit" className="btn btn-primary full-width">{t("S'inscrire")}</button>
            {googleOn && <GoogleButton next={redirect.current} />}
          </form>
        </div>
      </div>

      {toasts.map((t, i) => (
        <div key={t.id} className="toast-item" style={{ ['--i' as string]: i, position: 'fixed', bottom: 20 + i * 64, right: 20, backgroundColor: '#E68723', color: 'white', padding: '1rem 1.5rem', borderRadius: 2, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', zIndex: 1000, opacity: t.out ? 0 : 1, transition: 'opacity .3s' }}>{t.text}</div>
      ))}
    </AuthContext.Provider>
  );
}

/** « Continuer avec Google » : la connexion se fait côté API puis revient sur la page demandée. */
function GoogleButton({ next }: { next: string | null }) {
  return (
    <a href={`/api/v1/auth/google/start${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="btn btn-outline full-width google-btn" style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, textDecoration: 'none' }}>
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" /><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" /><path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.100 0 24s.9 7.600 2.600 10.800l7.900-6.100z" /><path fill="#34A853" d="M24 48c6.500 0 11.900-2.100 15.900-5.800l-7.600-5.900c-2.100 1.400-4.900 2.300-8.300 2.300-6.300 0-11.600-4.100-13.500-9.800l-7.900 6.100C6.500 42.600 14.600 48 24 48z" /></svg>
      {useT()('Continuer avec Google')}
    </a>
  );
}

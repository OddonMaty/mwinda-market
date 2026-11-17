'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface SessionUser {
  id: string;
  email: string;
  emailVerified: boolean;
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
  invalid_credentials: 'E-mail ou mot de passe incorrect.',
  too_many_requests: 'Trop de tentatives. Réessayez dans quelques minutes.',
  validation_error: 'Vérifiez les informations saisies (téléphone au format +243…).',
  account_suspended: 'Ce compte est suspendu.',
  wrong_password: 'Mot de passe actuel incorrect.',
  invalid_token: 'Ce lien est invalide.',
  token_used: 'Ce lien a déjà été utilisé.',
  token_expired: 'Ce lien a expiré.',
};
export const errorMessage = (code?: string): string =>
  ERRORS[code ?? ''] ?? (code?.startsWith('weak_password') ? 'Mot de passe trop faible (8 caractères minimum, pas trop courant).' : 'Une erreur est survenue. Réessayez.');

const CITY_SLUGS: Record<string, string | undefined> = { Bukavu: 'bukavu', Uvira: 'uvira', Goma: 'goma', Baraka: 'baraka', Autre: undefined };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'signin' | 'register'>('signin');
  const [toasts, setToasts] = useState<{ id: number; text: string; out: boolean }[]>([]);
  const nextId = useRef(1);
  const redirect = useRef<string | null>(null);

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

  const notify = useCallback((text: string) => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, text, out: false }]);
    setTimeout(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, out: true } : x))), 3000);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3300);
  }, []);

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
    const r = await api('/auth/login', { method: 'POST', body: { email: f.get('email'), password: f.get('password'), client: 'web' } });
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
        email: f.get('email'), password: f.get('password'), firstName: f.get('firstName'), lastName: f.get('lastName'),
        phone: String(f.get('phone') ?? '').replace(/[\s.-]/g, ''), countryCode: 'CD', citySlug: CITY_SLUGS[String(f.get('city'))], locale: 'fr',
      },
    });
    if (!r.ok) return notify(errorMessage(r.data.code));
    form.reset();
    setTab('signin');
    notify('Compte créé ! Vérifiez votre e-mail pour l’activer, puis connectez-vous.');
  }

  return (
    <AuthContext.Provider value={{ user, ready, openLogin, accountClick, logout, notify, refresh }}>
      {children}

      <div id="loginModal" className={`modal${open ? ' active' : ''}`}>
        <div className="modal-overlay" onClick={() => setOpen(false)} />
        <div className="modal-content">
          <button type="button" className="modal-close" onClick={() => setOpen(false)}><i className="fas fa-times" /></button>
          <div className="modal-tabs">
            <button type="button" className={`modal-tab${tab === 'signin' ? ' active' : ''}`} onClick={() => setTab('signin')}>Connexion</button>
            <button type="button" className={`modal-tab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>Inscription</button>
          </div>
          <form id="signinForm" className={`form-content${tab === 'signin' ? ' active' : ''}`} onSubmit={onSignin}>
            <div className="form-group"><label>Adresse e-mail *</label><input type="email" name="email" placeholder="votre@email.com" required /></div>
            <div className="form-group"><label>Mot de passe *</label><input type="password" name="password" placeholder="••••••••" required /></div>
            <button type="submit" className="btn btn-primary full-width">Se connecter</button>
            <div className="form-footer" style={{ marginTop: '1rem', marginBottom: 0 }}>
              <Link href="/mot-de-passe-oublie" className="link-btn" onClick={() => setOpen(false)}>Mot de passe oublié ?</Link>
            </div>
          </form>
          <form id="registerForm" className={`form-content${tab === 'register' ? ' active' : ''}`} onSubmit={onRegister}>
            <div className="form-row"><input type="text" name="firstName" placeholder="Prénom *" required /><input type="text" name="lastName" placeholder="Nom *" required /></div>
            <div className="form-group"><label>Adresse e-mail *</label><input type="email" name="email" placeholder="votre@email.com" required /></div>
            <div className="form-row">
              <input type="tel" name="phone" placeholder="Téléphone (+243...)" required />
              <select name="city" defaultValue="Bukavu">
                <option value="Bukavu">Bukavu</option><option value="Uvira">Uvira</option><option value="Goma">Goma</option>
                <option value="Baraka">Baraka (territoire de Fizi)</option><option value="Autre">Autre ville</option>
              </select>
            </div>
            <div className="form-group"><label>Mot de passe *</label><input type="password" name="password" placeholder="••••••••" required minLength={8} /></div>
            <label className="checkbox-label"><input type="checkbox" name="newsletter" /><span>S&apos;abonner à notre newsletter</span></label>
            <button type="submit" className="btn btn-primary full-width">S&apos;inscrire</button>
          </form>
        </div>
      </div>

      {toasts.map((t, i) => (
        <div key={t.id} style={{ position: 'fixed', bottom: 20 + i * 64, right: 20, backgroundColor: '#10B981', color: 'white', padding: '1rem 1.5rem', borderRadius: 2, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', zIndex: 1000, opacity: t.out ? 0 : 1, transition: 'opacity .3s' }}>{t.text}</div>
      ))}
    </AuthContext.Provider>
  );
}

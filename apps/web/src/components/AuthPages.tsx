'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api, errorMessage, useAuth } from './AuthProvider';

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="seller-landing" style={{ gridTemplateColumns: '1fr' }}>
      <div className="seller-auth-card" style={{ maxWidth: 420, margin: '0 auto' }}>{children}</div>
    </div>
  );
}
const muted = { marginBottom: '1.5rem', color: 'var(--text-muted)' } as const;

export function VerifyEmail({ token }: { token?: string }) {
  const { openLogin, refresh } = useAuth();
  const [state, setState] = useState<'loading' | 'ok' | 'error'>(token ? 'loading' : 'error');
  const done = useRef(false);
  useEffect(() => {
    if (!token || done.current) return;
    done.current = true; // le jeton est à usage unique : un seul appel
    void api('/auth/verify-email', { method: 'POST', body: { token } }).then(async (r) => { setState(r.ok ? 'ok' : 'error'); if (r.ok) await refresh(); });
  }, [token, refresh]);
  return (
    <Card>
      {state === 'loading' && <p style={muted}>Vérification en cours…</p>}
      {state === 'ok' && (<><p style={muted}>Votre adresse e-mail est confirmée. Vous pouvez vous connecter.</p><button type="button" className="btn btn-primary full-width" onClick={() => openLogin('signin')}>Se connecter</button></>)}
      {state === 'error' && (<><p style={muted}>Ce lien est invalide ou a expiré. Connectez-vous pour recevoir un nouveau lien de confirmation.</p><button type="button" className="btn btn-primary full-width" onClick={() => openLogin('signin')}>Se connecter</button></>)}
    </Card>
  );
}

export function ForgotPassword() {
  const { notify } = useAuth();
  const [sent, setSent] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const r = await api('/auth/forgot-password', { method: 'POST', body: { email: new FormData(e.currentTarget).get('email') } });
    if (!r.ok) return notify(errorMessage(r.data.code));
    setSent(true);
  }
  if (sent) return <Card><p style={muted}>Si un compte existe pour cette adresse, un e-mail contenant un lien de réinitialisation vient d&apos;être envoyé (valable 1 heure).</p></Card>;
  return (
    <Card>
      <p style={muted}>Saisissez l&apos;adresse e-mail de votre compte : nous vous enverrons un lien pour choisir un nouveau mot de passe.</p>
      <form onSubmit={submit}>
        <div className="form-group"><label>Adresse e-mail *</label><input type="email" name="email" placeholder="votre@email.com" required /></div>
        <button type="submit" className="btn btn-primary full-width">Envoyer le lien</button>
      </form>
    </Card>
  );
}

export function ResetPassword({ token }: { token?: string }) {
  const { notify, openLogin } = useAuth();
  const [done, setDone] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const r = await api('/auth/reset-password', { method: 'POST', body: { token, password: new FormData(e.currentTarget).get('password') } });
    if (!r.ok) return notify(errorMessage(r.data.code));
    setDone(true);
  }
  if (!token) return <Card><p style={muted}>Lien invalide. <Link href="/mot-de-passe-oublie">Demander un nouveau lien</Link></p></Card>;
  if (done) return <Card><p style={muted}>Mot de passe modifié. Tous vos appareils ont été déconnectés.</p><button type="button" className="btn btn-primary full-width" onClick={() => openLogin('signin')}>Se connecter</button></Card>;
  return (
    <Card>
      <form onSubmit={submit}>
        <div className="form-group"><label>Nouveau mot de passe *</label><input type="password" name="password" placeholder="8 caractères minimum" required minLength={8} /></div>
        <button type="submit" className="btn btn-primary full-width">Enregistrer</button>
      </form>
    </Card>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api, errorMessage, useAuth } from './AuthProvider';
import { useT } from './I18n';

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
  const { notify, openLogin } = useAuth();
  const t = useT();
  const [step, setStep] = useState<'ask' | 'mail' | 'code' | 'done'>('ask');
  const [phone, setPhone] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const id = String(new FormData(e.currentTarget).get('identifier') ?? '').trim();
    const r = await api('/auth/forgot-password', { method: 'POST', body: { identifier: id } });
    if (!r.ok) return notify(errorMessage(r.data.code));
    if (id.includes('@')) return setStep('mail');
    setPhone(id.replace(/[\s.-]/g, ''));
    setStep('code');
  }
  async function reset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await api('/auth/reset-password-phone', { method: 'POST', body: { phone, code: String(f.get('code') ?? '').trim(), password: f.get('password') } });
    if (!r.ok) return notify(errorMessage(r.data.code));
    setStep('done');
  }
  if (step === 'mail') return <Card><p style={muted}>Si un compte existe pour cette adresse, un e-mail contenant un lien de réinitialisation vient d&apos;être envoyé (valable 1 heure).</p></Card>;
  if (step === 'done') return <Card><p style={muted}>{t('Mot de passe modifié. Tous vos appareils ont été déconnectés.')}</p><button type="button" className="btn btn-primary full-width" onClick={() => openLogin('signin')}>{t('Se connecter')}</button></Card>;
  if (step === 'code') return (
    <Card>
      <p style={muted}>Si un compte correspond à ce numéro, un code à 6 chiffres vient d&apos;être envoyé par WhatsApp ou SMS (valable 10 minutes).</p>
      <form onSubmit={reset}>
        <div className="form-group"><label>{t('Code reçu *')}</label><input type="text" name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="123456" required /></div>
        <div className="form-group"><label>{t('Nouveau mot de passe *')}</label><input type="password" name="password" placeholder="8 caractères minimum" required minLength={8} /></div>
        <button type="submit" className="btn btn-primary full-width">{t('Enregistrer')}</button>
      </form>
    </Card>
  );
  return (
    <Card>
      <p style={muted}>{t("Saisissez l'e-mail ou le numéro de téléphone de votre compte : nous vous enverrons un lien (e-mail) ou un code (WhatsApp / SMS).")}</p>
      <form onSubmit={submit}>
        <div className="form-group"><label>{t('E-mail ou téléphone *')}</label><input type="text" name="identifier" placeholder={t('votre@email.com ou +243…')} required /></div>
        <button type="submit" className="btn btn-primary full-width">{t('Continuer')}</button>
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

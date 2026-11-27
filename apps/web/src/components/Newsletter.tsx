'use client';
import { useState } from 'react';
import { api, useAuth } from './AuthProvider';
import { useI18n, useT } from './I18n';

/** Inscription à la newsletter : e-mail + bouton, branchés sur l'API. */
export function NewsletterForm({ stacked = false }: { stacked?: boolean }) {
  const { notify } = useAuth();
  const { lang } = useI18n();
  const t = useT();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) return notify('Entrez une adresse e-mail valide.');
    setBusy(true);
    const r = await api('/newsletter', { method: 'POST', body: { email, locale: lang } });
    setBusy(false);
    if (!r.ok) return notify(r.status === 429 ? 'Trop de tentatives. Réessayez dans une minute.' : 'Entrez une adresse e-mail valide.');
    setEmail('');
    notify('Merci ! Vous êtes inscrit(e) à la newsletter.');
  }

  return (
    <form onSubmit={submit} className={stacked ? 'newsletter-stacked' : 'newsletter-input'} style={stacked ? { display: 'contents' } : undefined}>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('Votre adresse e-mail')} aria-label={t('Votre adresse e-mail')} />
      <button type="submit" className="btn btn-primary" disabled={busy}>{t("S'abonner")}</button>
    </form>
  );
}

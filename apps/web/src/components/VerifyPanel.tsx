'use client';

import { useEffect, useState } from 'react';
import { BadgeCheck, Mail, MessageCircle, Smartphone } from 'lucide-react';
import { api, errorMessage, useAuth } from './AuthProvider';
import { useT } from './I18n';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Field, Input } from './ui';

type Channel = 'email' | 'sms' | 'whatsapp';
interface Channels { email: boolean; sms: boolean; whatsapp: boolean }

/** Vérification FACULTATIVE du compte : par e-mail (lien), SMS ou WhatsApp (code à 6 chiffres). */
export function VerifyPanel() {
  const { user, notify, refresh } = useAuth();
  const t = useT();
  const [channels, setChannels] = useState<Channels | null>(null);
  const [pending, setPending] = useState<Channel | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { void api<Channels>('/auth/channels').then((r) => setChannels(r.ok ? r.data : { email: false, sms: false, whatsapp: false })); }, []);
  if (!user) return null;

  async function start(channel: Channel) {
    setBusy(true);
    const r = await api('/auth/verify/start', { method: 'POST', body: { channel } });
    setBusy(false);
    if (!r.ok) return notify(errorMessage(r.data.code));
    setPending(channel);
    notify(channel === 'email' ? 'E-mail envoyé : cliquez sur le lien reçu.' : 'Code envoyé. Il est valable 10 minutes.');
  }
  async function confirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get('code') ?? '').trim();
    const r = await api('/auth/verify/confirm', { method: 'POST', body: { code } });
    if (!r.ok) return notify(r.status === 429 ? 'Trop d’essais. Demandez un nouveau code.' : errorMessage(r.data.code));
    setPending(null);
    await refresh();
    notify('Compte vérifié ✔');
  }

  if (user.verified) {
    return <Card><CardContent className="flex items-center gap-3 pt-5"><BadgeCheck className="size-6 text-primary" /><div><p className="font-semibold">{t('Compte vérifié')}</p><p className="text-sm text-muted-foreground">{user.emailVerified ? 'E-mail confirmé' : ''}{user.emailVerified && user.phoneVerified ? ' · ' : ''}{user.phoneVerified ? 'Numéro confirmé' : ''}</p></div></CardContent></Card>;
  }
  const options: { key: Channel; label: string; icon: typeof Mail; ok: boolean; hint: string }[] = [
    { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, ok: !!user.phone && !!channels?.whatsapp, hint: user.phone ?? 'Ajoutez un numéro dans votre profil' },
    { key: 'sms', label: 'SMS', icon: Smartphone, ok: !!user.phone && !!channels?.sms, hint: user.phone ?? 'Ajoutez un numéro dans votre profil' },
    { key: 'email', label: 'E-mail', icon: Mail, ok: !!user.email && !!channels?.email, hint: user.email ?? 'Aucun e-mail sur ce compte' },
  ];
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2">{t('Vérifier mon compte')} <Badge variant="secondary">{t('Facultatif')}</Badge></CardTitle><CardDescription>{t('Vous pouvez acheter et vendre sans vérification. Vérifier votre compte le sécurise et permet de récupérer votre mot de passe.')}</CardDescription></CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {options.map((o) => (
            <button key={o.key} type="button" disabled={!o.ok || busy} onClick={() => void start(o.key)} className="flex items-center gap-3 rounded-xl border p-4 text-left hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50">
              <o.icon className="size-5 text-primary" /><span className="min-w-0 flex-1"><b className="block text-sm">{o.label}</b><span className="block truncate text-xs text-muted-foreground">{channels && !channels[o.key] ? t('Bientôt disponible') : o.hint}</span></span>
            </button>
          ))}
        </div>
        {pending && pending !== 'email' && (
          <form className="flex flex-wrap items-end gap-3" onSubmit={confirm}>
            <Field label={t('Code à 6 chiffres')}><Input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="123456" required /></Field>
            <Button type="submit">{t('Valider')}</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

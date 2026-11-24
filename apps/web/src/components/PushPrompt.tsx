'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, useAuth } from './AuthProvider';
import { useT } from './I18n';

const DISMISS = 'mwinda_push_dismissed';
const b64ToBytes = (b64: string) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

async function subscribe(): Promise<boolean> {
  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  const key = await api<{ publicKey: string | null }>('/push/key');
  if (!key.ok || !key.data.publicKey) return false;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key.data.publicKey) }));
  const j = sub.toJSON();
  const r = await api('/push/subscribe', { method: 'POST', body: { endpoint: j.endpoint, keys: j.keys } });
  return r.ok;
}

/** Invite à activer les notifications (messages, commandes) dans la barre du téléphone. Sur iPhone, le site doit d'abord être ajouté à l'écran d'accueil. */
export function PushPrompt() {
  const { user, notify } = useAuth();
  const t = useT();
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (!user || typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    setIos(isIos && !standalone);
    if (!('PushManager' in window) || !('Notification' in window)) { if (isIos && !standalone) setShow(true); return; }
    if (Notification.permission === 'granted') { void subscribe().catch(() => {}); return; } // ré-enregistre l'appareil après connexion
    if (Notification.permission === 'denied') return;
    let dismissed = 0;
    try { dismissed = Number(localStorage.getItem(DISMISS) ?? 0); } catch { /* ignoré */ }
    if (Date.now() - dismissed > 3 * 24 * 3600 * 1000) setShow(true);
  }, [user]);

  const enable = useCallback(async () => {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { notify('Notifications refusées : vous pouvez les réactiver dans les réglages du navigateur.'); return setShow(false); }
      const ok = await subscribe();
      notify(ok ? 'Notifications activées ✔' : 'Notifications indisponibles pour le moment.');
    } catch { notify('Notifications indisponibles sur cet appareil.'); }
    setShow(false);
  }, [notify]);
  const later = () => { try { localStorage.setItem(DISMISS, String(Date.now())); } catch { /* ignoré */ } setShow(false); };

  if (!show || !user) return null;
  return (
    <div role="dialog" aria-label={t('Notifications')} style={{ position: 'fixed', left: 12, right: 12, bottom: 76, zIndex: 120, maxWidth: 440, margin: '0 auto', background: '#fff', border: '1px solid var(--border, #e5e7eb)', borderRadius: 14, boxShadow: '0 8px 30px rgba(0,0,0,.18)', padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
      <i className="fas fa-bell" style={{ fontSize: 22, color: 'var(--primary, #e98a2b)' }} />
      <div style={{ flex: 1, fontSize: 14, lineHeight: 1.35 }}>
        <b>{t('Activer les notifications')}</b>
        <div style={{ color: '#6b7280' }}>{ios ? t('Sur iPhone : touchez Partager puis « Sur l’écran d’accueil », ouvrez l’application, puis activez les notifications.') : t('Soyez prévenu des nouveaux messages et commandes, même quand le site est fermé.')}</div>
      </div>
      {!ios && <button type="button" className="btn btn-primary" onClick={() => void enable()}>{t('Activer')}</button>}
      <button type="button" aria-label={t('Fermer')} onClick={later} style={{ background: 'none', border: 0, fontSize: 18, cursor: 'pointer' }}>×</button>
    </div>
  );
}

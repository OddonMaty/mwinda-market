import * as webpush from 'web-push';
import type { Db } from '../db/client.js';
import { newId } from '../lib/crypto.js';

export interface PushPayload { title: string; body: string; url: string; tag?: string }

/** Notification dans la barre du téléphone / du navigateur (Web Push, clés VAPID). */
export interface PushSender {
  available(): boolean;
  publicKey(): string | null;
  send(userId: string, p: PushPayload): Promise<void>;
}

export class WebPushSender implements PushSender {
  constructor(private db: Db, private keys?: { publicKey?: string; privateKey?: string; subject?: string }) {
    if (this.available()) webpush.setVapidDetails(keys!.subject ?? 'mailto:contact@mwindamarket.com', keys!.publicKey!, keys!.privateKey!);
  }
  available() { return !!(this.keys?.publicKey && this.keys?.privateKey); }
  publicKey() { return this.available() ? this.keys!.publicKey! : null; }

  async send(userId: string, p: PushPayload) {
    if (!this.available()) return;
    const subs = await this.db.query<{ id: string; endpoint: string; p256dh: string; auth: string }>('SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1', [userId]);
    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(p), { TTL: 60 * 60 * 24, urgency: 'high' });
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await this.db.query('DELETE FROM push_subscriptions WHERE id = $1', [s.id]); // abonnement résilié par l'appareil
        else console.error('[push] envoi impossible', code ?? (e instanceof Error ? e.message : e));
      }
    }));
  }
}

/** Pour les tests : mémorise les notifications au lieu de les envoyer. */
export class MemoryPush implements PushSender {
  sent: { userId: string; payload: PushPayload }[] = [];
  available() { return true; }
  publicKey() { return 'test-public-key'; }
  async send(userId: string, payload: PushPayload) { this.sent.push({ userId, payload }); }
}

export async function saveSubscription(db: Db, userId: string, s: { endpoint: string; p256dh: string; auth: string; userAgent?: string }) {
  await db.query(
    `INSERT INTO push_subscriptions(id, user_id, endpoint, p256dh, auth, user_agent) VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, user_agent = EXCLUDED.user_agent`,
    [newId(), userId, s.endpoint, s.p256dh, s.auth, s.userAgent?.slice(0, 200) ?? null]);
}
export async function removeSubscription(db: Db, userId: string, endpoint: string) {
  await db.query('DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2', [userId, endpoint]);
}

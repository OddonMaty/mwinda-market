import type { Messenger } from './messenger.js';
import type { Db } from '../db/client.js';
import type { Mailer } from '../mail/mailer.js';
import * as tpl from '../mail/templates.js';

const loc = (l: string | null | undefined): 'fr' | 'en' => (l === 'en' ? 'en' : 'fr');

/** E-mails liés aux commandes et aux abonnements. Un envoi raté ne doit jamais faire échouer l'action du client. */
export class Notifier {
  constructor(private db: Db, private mailer: Mailer, private baseUrl: string, private messenger?: Messenger) {}

  private async safe(fn: () => Promise<void>) {
    try { await fn(); } catch (e) { console.error('[mail] envoi impossible', e instanceof Error ? e.message : e); }
  }

  private async lines(orderId: string, shopId?: string) {
    const rows = await this.db.query<{ name: string; quantity: number; unit_price_usd: string }>(
      `SELECT name, quantity, unit_price_usd FROM order_items WHERE order_id = $1 ${shopId ? 'AND shop_id = $2' : ''} ORDER BY name`, shopId ? [orderId, shopId] : [orderId]);
    return rows.map((r) => ({ name: r.name, quantity: r.quantity, unitUsd: Number(r.unit_price_usd) }));
  }

  /** Confirmation à l'acheteur (s'il a une adresse e-mail), alerte « nouvelle commande » à chaque vendeur (e-mail et/ou WhatsApp). */
  orderPlaced(orderId: string) {
    return this.safe(async () => {
      const o = (await this.db.query<{ number: string; subtotal_usd: string; email: string | null; locale: string }>('SELECT o.number, o.subtotal_usd, u.email, u.locale FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = $1', [orderId]))[0];
      if (!o) return;
      if (o.email) await this.mailer.send(tpl.orderPlaced(loc(o.locale), o.email, o.number, await this.lines(orderId), Number(o.subtotal_usd), `${this.baseUrl}/suivi`));
      const shops = await this.db.query<{ id: string; name: string; email: string | null; locale: string; whatsapp: string | null; notify_whatsapp: boolean }>(
        'SELECT DISTINCT s.id, s.name, u.email, u.locale, s.whatsapp, s.notify_whatsapp FROM order_items i JOIN shops s ON s.id = i.shop_id JOIN users u ON u.id = s.owner_id WHERE i.order_id = $1', [orderId]);
      for (const s of shops) {
        if (s.email) await this.safe(async () => this.mailer.send(tpl.newOrderSeller(loc(s.locale), s.email!, s.name, o.number, await this.lines(orderId, s.id), `${this.baseUrl}/vendeur`)));
        await this.whatsapp(s, 'new_order', [o.number, s.name, `${this.baseUrl}/vendeur`]);
      }
    });
  }

  /** Message WhatsApp au vendeur, seulement s'il a donné un numéro, accepté les notifications et que le canal est configuré. */
  private async whatsapp(s: { whatsapp: string | null; notify_whatsapp: boolean; locale: string }, template: 'new_order' | 'withdrawal', params: string[]) {
    if (!s.whatsapp || !s.notify_whatsapp || !this.messenger?.available().whatsapp) return;
    await this.safe(() => this.messenger!.notify(s.whatsapp!, template, params, s.locale));
  }

  /** Prévient l'acheteur quand sa commande est confirmée, expédiée, livrée ou annulée. */
  orderStatus(orderId: string, status: string) {
    return this.safe(async () => {
      const o = (await this.db.query<{ number: string; email: string | null; locale: string }>('SELECT o.number, u.email, u.locale FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = $1', [orderId]))[0];
      if (o?.email) await this.mailer.send(tpl.orderStatus(loc(o.locale), o.email, o.number, status, `${this.baseUrl}/suivi`));
    });
  }

  planDecision(shopId: string, approved: boolean) {
    return this.safe(async () => {
      const r = (await this.db.query<{ name: string; email: string | null; locale: string; plan_name: string }>(
        `SELECT s.name, u.email, u.locale, (SELECT p.name FROM plan_requests q JOIN plans p ON p.code = q.plan WHERE q.shop_id = s.id ORDER BY q.decided_at DESC NULLS LAST LIMIT 1) AS plan_name
           FROM shops s JOIN users u ON u.id = s.owner_id WHERE s.id = $1`, [shopId]))[0];
      if (r?.email) await this.mailer.send(tpl.planDecision(loc(r.locale), r.email, r.name, r.plan_name ?? '', approved, `${this.baseUrl}/vendeur`));
    });
  }

  /** Décision de l'administration sur une demande de retrait : e-mail et/ou WhatsApp au vendeur. */
  withdrawalDecision(withdrawalId: string) {
    return this.safe(async () => {
      const r = (await this.db.query<{ amount_usd: string; status: string; reason: string | null; reference: string | null; name: string; email: string | null; locale: string; whatsapp: string | null; notify_whatsapp: boolean }>(
        `SELECT w.amount_usd, w.status, w.reason, w.reference, s.name, u.email, u.locale, s.whatsapp, s.notify_whatsapp
           FROM withdrawals w JOIN shops s ON s.id = w.shop_id JOIN users u ON u.id = s.owner_id WHERE w.id = $1`, [withdrawalId]))[0];
      if (!r) return;
      const paid = r.status === 'paid';
      const amount = `$${Number(r.amount_usd).toFixed(2)}`;
      if (r.email) await this.mailer.send(tpl.withdrawalDecision(loc(r.locale), r.email, r.name, amount, paid, r.reference ?? r.reason, `${this.baseUrl}/vendeur`));
      await this.whatsapp(r, 'withdrawal', [amount, paid ? (loc(r.locale) === 'fr' ? 'payée' : 'paid') : (loc(r.locale) === 'fr' ? 'refusée' : 'declined'), `${this.baseUrl}/vendeur`]);
    });
  }
}

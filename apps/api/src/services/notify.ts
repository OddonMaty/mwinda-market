import type { Db } from '../db/client.js';
import type { Mailer } from '../mail/mailer.js';
import * as tpl from '../mail/templates.js';

const loc = (l: string | null | undefined): 'fr' | 'en' => (l === 'en' ? 'en' : 'fr');

/** E-mails liés aux commandes et aux abonnements. Un envoi raté ne doit jamais faire échouer l'action du client. */
export class Notifier {
  constructor(private db: Db, private mailer: Mailer, private baseUrl: string) {}

  private async safe(fn: () => Promise<void>) {
    try { await fn(); } catch (e) { console.error('[mail] envoi impossible', e instanceof Error ? e.message : e); }
  }

  private async lines(orderId: string, shopId?: string) {
    const rows = await this.db.query<{ name: string; quantity: number; unit_price_usd: string }>(
      `SELECT name, quantity, unit_price_usd FROM order_items WHERE order_id = $1 ${shopId ? 'AND shop_id = $2' : ''} ORDER BY name`, shopId ? [orderId, shopId] : [orderId]);
    return rows.map((r) => ({ name: r.name, quantity: r.quantity, unitUsd: Number(r.unit_price_usd) }));
  }

  /** Confirmation à l'acheteur, et une alerte « nouvelle commande » à chaque vendeur concerné. */
  orderPlaced(orderId: string) {
    return this.safe(async () => {
      const o = (await this.db.query<{ number: string; subtotal_usd: string; email: string; locale: string }>('SELECT o.number, o.subtotal_usd, u.email, u.locale FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = $1', [orderId]))[0];
      if (!o) return;
      await this.mailer.send(tpl.orderPlaced(loc(o.locale), o.email, o.number, await this.lines(orderId), Number(o.subtotal_usd), `${this.baseUrl}/suivi`));
      const shops = await this.db.query<{ id: string; name: string; email: string; locale: string }>(
        'SELECT DISTINCT s.id, s.name, u.email, u.locale FROM order_items i JOIN shops s ON s.id = i.shop_id JOIN users u ON u.id = s.owner_id WHERE i.order_id = $1', [orderId]);
      for (const s of shops) await this.safe(async () => this.mailer.send(tpl.newOrderSeller(loc(s.locale), s.email, s.name, o.number, await this.lines(orderId, s.id), `${this.baseUrl}/vendeur`)));
    });
  }

  /** Prévient l'acheteur quand sa commande est confirmée, expédiée, livrée ou annulée. */
  orderStatus(orderId: string, status: string) {
    return this.safe(async () => {
      const o = (await this.db.query<{ number: string; email: string; locale: string }>('SELECT o.number, u.email, u.locale FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = $1', [orderId]))[0];
      if (o) await this.mailer.send(tpl.orderStatus(loc(o.locale), o.email, o.number, status, `${this.baseUrl}/suivi`));
    });
  }

  planDecision(shopId: string, approved: boolean) {
    return this.safe(async () => {
      const r = (await this.db.query<{ name: string; email: string; locale: string; plan_name: string }>(
        `SELECT s.name, u.email, u.locale, (SELECT p.name FROM plan_requests q JOIN plans p ON p.code = q.plan WHERE q.shop_id = s.id ORDER BY q.decided_at DESC NULLS LAST LIMIT 1) AS plan_name
           FROM shops s JOIN users u ON u.id = s.owner_id WHERE s.id = $1`, [shopId]))[0];
      if (r) await this.mailer.send(tpl.planDecision(loc(r.locale), r.email, r.name, r.plan_name ?? '', approved, `${this.baseUrl}/vendeur`));
    });
  }
}

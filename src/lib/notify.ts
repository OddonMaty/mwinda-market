/**
 * Notification minimale.
 * Configure SMTP_HOST / SMTP_USER / SMTP_PASS / ADMIN_EMAIL pour activer l'envoi réel.
 */
export async function notifyNewOrder(order: {
  reference: string;
  customerName: string;
  amountUsd: number;
  vendorId?: string | null;
}) {
  const message = `[Mwinda] Nouvelle commande ${order.reference} — ${order.customerName} — ${order.amountUsd} USD`;

  console.log(message + (order.vendorId ? ` (vendeur ${order.vendorId})` : ""));

  if (process.env.SMTP_HOST && process.env.ADMIN_EMAIL) {
    console.log(`[NOTIFY] Email prêt à envoyer à ${process.env.ADMIN_EMAIL} (SMTP configuré)`);
    // TODO: implémenter Nodemailer / Resend ici
  } else {
    console.log("[NOTIFY] SMTP non configuré — log uniquement");
  }
}

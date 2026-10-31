/**
 * Notification minimale.
 * Configure SMTP_HOST / SMTP_USER / SMTP_PASS pour activer l'envoi réel plus tard.
 */
export async function notifyNewOrder(order: {
  reference: string;
  customerName: string;
  amountUsd: number;
  vendorId?: string | null;
}) {
  const message = `[Mwinda] Nouvelle commande ${order.reference} — ${order.customerName} — ${order.amountUsd} USD`;

  console.log(message + (order.vendorId ? ` (vendeur ${order.vendorId})` : ""));

  // Stub email : à remplacer par Nodemailer / Resend quand SMTP est configuré
  if (process.env.SMTP_HOST && process.env.ADMIN_EMAIL) {
    console.log(`[NOTIFY] Email prêt à envoyer à ${process.env.ADMIN_EMAIL}`);
    // TODO: implémenter l'envoi réel
  }
}

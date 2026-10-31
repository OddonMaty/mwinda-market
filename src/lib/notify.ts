/**
 * Notification minimale (stub).
 * En production : remplacer par envoi email (Nodemailer / Resend) ou WhatsApp API.
 */
export async function notifyNewOrder(order: {
  reference: string;
  customerName: string;
  amountUsd: number;
  vendorId?: string | null;
}) {
  console.log(
    `[NOTIFY] Nouvelle commande ${order.reference} — ${order.customerName} — ${order.amountUsd} USD` +
      (order.vendorId ? ` (vendeur ${order.vendorId})` : "")
  );

  // TODO: envoyer email au vendeur / admin
  // TODO: message WhatsApp si numéro configuré
}

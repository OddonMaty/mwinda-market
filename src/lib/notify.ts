import nodemailer from "nodemailer";

interface OrderNotify {
  reference: string;
  customerName: string;
  amountUsd: number;
  vendorId?: string | null;
  customerEmail?: string | null;
  customerPhone?: string;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function notifyNewOrder(order: OrderNotify) {
  const subject = `[Mwinda] Nouvelle commande ${order.reference}`;
  const text = [
    `Nouvelle commande reçue`,
    ``,
    `Référence : ${order.reference}`,
    `Client     : ${order.customerName}`,
    `Téléphone  : ${order.customerPhone || "—"}`,
    `Email      : ${order.customerEmail || "—"}`,
    `Montant    : ${order.amountUsd} USD`,
    order.vendorId ? `Vendeur ID : ${order.vendorId}` : "",
  ].filter(Boolean).join("\n");

  console.log(text);

  const transporter = getTransporter();
  if (!transporter) {
    console.log("[NOTIFY] SMTP non configuré — log uniquement");
    return;
  }

  const to = process.env.ADMIN_EMAIL;
  if (!to) {
    console.log("[NOTIFY] ADMIN_EMAIL manquant");
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    console.log(`[NOTIFY] Email envoyé à ${to}`);
  } catch (err) {
    console.error("[NOTIFY] Échec envoi email:", err);
  }
}

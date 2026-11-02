import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

interface OrderNotify {
  reference: string;
  customerName: string;
  amountUsd: number;
  vendorId?: string | null;
  customerEmail?: string | null;
  customerPhone?: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "En attente de paiement",
  paid: "Paiement reçu",
  preparing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

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

async function sendMail(to: string, subject: string, text: string) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[NOTIFY] SMTP non configuré — ${to}: ${subject}`);
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
    console.error(`[NOTIFY] Échec email ${to}:`, err);
  }
}

async function sendWhatsApp(to: string, message: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    console.log(`[NOTIFY] WhatsApp non configuré — ${to}: ${message}`);
    return;
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to.replace(/\D/g, ""),
          type: "text",
          text: { body: message },
        }),
      }
    );
    if (!res.ok) {
      console.error("[NOTIFY] WhatsApp erreur:", await res.text());
    } else {
      console.log(`[NOTIFY] WhatsApp envoyé à ${to}`);
    }
  } catch (err) {
    console.error("[NOTIFY] WhatsApp exception:", err);
  }
}

export async function notifyNewOrder(order: OrderNotify) {
  const adminText = [
    `Nouvelle commande reçue`,
    ``,
    `Référence : ${order.reference}`,
    `Client     : ${order.customerName}`,
    `Téléphone  : ${order.customerPhone || "—"}`,
    `Email      : ${order.customerEmail || "—"}`,
    `Montant    : ${order.amountUsd} USD`,
  ].join("\n");

  console.log(adminText);

  if (process.env.ADMIN_EMAIL) {
    await sendMail(process.env.ADMIN_EMAIL, `[Mwinda] Nouvelle commande ${order.reference}`, adminText);
  }

  if (order.vendorId) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: order.vendorId },
      include: { user: true },
    });

    if (vendor?.user?.email) {
      const vendorText = [
        `Vous avez reçu une nouvelle commande`,
        ``,
        `Référence : ${order.reference}`,
        `Client     : ${order.customerName}`,
        `Téléphone  : ${order.customerPhone || "—"}`,
        `Montant    : ${order.amountUsd} USD`,
        ``,
        `Connectez-vous à votre espace vendeur pour la préparer.`,
      ].join("\n");

      await sendMail(vendor.user.email, `[Mwinda] Nouvelle commande ${order.reference}`, vendorText);
    }

    if (vendor?.whatsapp) {
      await sendWhatsApp(
        vendor.whatsapp,
        `Mwinda : Nouvelle commande ${order.reference} — ${order.customerName} — ${order.amountUsd} USD`
      );
    }
  }

  if (order.customerEmail) {
    const clientText = [
      `Merci pour votre commande sur Mwinda Market`,
      ``,
      `Référence : ${order.reference}`,
      `Montant    : ${order.amountUsd} USD`,
      ``,
      `Votre commande est en attente de confirmation de paiement.`,
      `Vous pouvez la suivre ou l'annuler depuis votre compte.`,
    ].join("\n");

    await sendMail(order.customerEmail, `[Mwinda] Confirmation de commande ${order.reference}`, clientText);
  }

  if (order.customerPhone) {
    await sendWhatsApp(
      order.customerPhone,
      `Mwinda : Commande ${order.reference} enregistrée — ${order.amountUsd} USD. Merci !`
    );
  }
}

export async function notifyStatusChange(orderId: string, newStatus: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { vendor: { include: { user: true } } },
  });

  if (!order) return;

  const label = STATUS_LABELS[newStatus] || newStatus;
  const subject = `[Mwinda] Commande ${order.reference} — ${label}`;
  const text = [
    `Le statut de votre commande a changé.`,
    ``,
    `Référence : ${order.reference}`,
    `Nouveau statut : ${label}`,
    `Montant : ${Number(order.amountUsd).toFixed(2)} USD`,
  ].join("\n");

  console.log(text);

  if (order.customerEmail) {
    await sendMail(order.customerEmail, subject, text);
  }

  if (order.customerPhone) {
    await sendWhatsApp(order.customerPhone, `Mwinda : Commande ${order.reference} — ${label}`);
  }

  if (order.vendor?.user?.email) {
    await sendMail(order.vendor.user.email, subject, text);
  }

  if (order.vendor?.whatsapp) {
    await sendWhatsApp(order.vendor.whatsapp, `Mwinda : Commande ${order.reference} — ${label}`);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

// ── Stockage OTP en mémoire (valide 15 min) ─────────────────────────────────
// Format : { [userId]: { code, expiresAt, target, channel } }
const verificationStore: Record<
  string,
  { code: string; expiresAt: number; target: string; channel: string }
> = {};

// ── Envoi email via SMTP (Nodemailer) ────────────────────────────────────────
async function sendOtpEmail(to: string, code: string, name: string): Promise<boolean> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || "587");
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || `Mwinda Market <noreply@mwinda.market>`;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log(`[OTP EMAIL — DEV/STANDALONE] Code ${code} pour ${to}`);
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject: `${code} — Votre code de vérification Mwinda Market`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:12px;border:1px solid #e2e8f0;">
        <img src="https://mwinda.market/images/logo-mwinda-horizontal.png" alt="Mwinda Market" style="height:40px;margin-bottom:24px;" />
        <h2 style="color:#0B1B3D;font-size:20px;margin-bottom:8px;">Bonjour ${name} 👋</h2>
        <p style="color:#475569;font-size:14px;line-height:1.6;margin-bottom:24px;">
          Voici votre code de vérification pour confirmer votre adresse email sur Mwinda Market.
        </p>
        <div style="background:#F8FAFC;border:2px dashed #EA580C;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
          <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#0B1B3D;">${code}</span>
        </div>
        <p style="color:#94a3b8;font-size:12px;line-height:1.6;">
          Ce code expire dans <strong>15 minutes</strong>. Si vous n'avez pas demandé ce code, ignorez cet email.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
        <p style="color:#94a3b8;font-size:11px;">© Mwinda Market — La marketplace panafricaine</p>
      </div>
    `,
    text: `Votre code de vérification Mwinda Market : ${code}\n\nCe code expire dans 15 minutes.`,
  });
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const uid = req.cookies.get("mwinda_uid")?.value;
    if (!uid) {
      return NextResponse.json({ error: "Veuillez vous connecter." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    const body = await req.json();
    const action = body.action; // 'send' ou 'verify'

    // ── ACTION 1 : Générer et envoyer le code OTP ─────────────────────────────
    if (action === "send") {
      const channel = body.channel || "email"; // 'email' ou 'phone'
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const target = channel === "phone" ? (user.phone || "") : user.email;

      if (!target) {
        return NextResponse.json(
          { error: channel === "phone" ? "Numéro de téléphone non renseigné." : "Email introuvable." },
          { status: 400 }
        );
      }

      verificationStore[uid] = {
        code,
        expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
        target,
        channel,
      };

      let emailActuallySent = false;
      if (channel === "email") {
        try {
          const sent = await sendOtpEmail(target, code, user.name || "");
          emailActuallySent = Boolean(sent);
        } catch (mailErr: any) {
          console.error("[OTP EMAIL ERROR]", mailErr);
        }
      }

      console.log(`[VERIFY] Code OTP ${channel} pour ${user.email}: ${code}`);

      return NextResponse.json({
        success: true,
        message: emailActuallySent
          ? `Code de vérification envoyé à ${user.email}. Consultez votre boîte de réception (et vos spams).`
          : `Code de vérification : ${code} (Code de secours : 123456)`,
        demoCode: code,
        emailSent: emailActuallySent,
      });
    }

    // ── ACTION 2 : Valider le code saisi ──────────────────────────────────────
    if (action === "verify") {
      const submittedCode = (body.code || "").trim();
      const record = verificationStore[uid];

      if (!record) {
        return NextResponse.json(
          { error: "Aucun code demandé ou le code a expiré. Cliquez sur 'Recevoir un code'." },
          { status: 400 }
        );
      }

      if (Date.now() > record.expiresAt) {
        delete verificationStore[uid];
        return NextResponse.json(
          { error: "Ce code a expiré. Veuillez demander un nouveau code." },
          { status: 400 }
        );
      }

      // Accepte le code généré ou code maître de démo "123456"
      if (submittedCode !== record.code && submittedCode !== "123456") {
        return NextResponse.json(
          { error: "Code de vérification incorrect. Vérifiez le code reçu." },
          { status: 400 }
        );
      }

      // Marquer le compte comme vérifié en base
      await prisma.user.update({
        where: { id: uid },
        data: { emailVerified: new Date() },
      });

      delete verificationStore[uid];

      return NextResponse.json({
        success: true,
        message: "Félicitations ! Votre compte est désormais certifié et vérifié.",
        isVerified: true,
      });
    }

    return NextResponse.json({ error: "Action non reconnue." }, { status: 400 });
  } catch (err: any) {
    console.error("[API/auth/verify]", err);
    return NextResponse.json({ error: err.message || "Erreur serveur." }, { status: 500 });
  }
}

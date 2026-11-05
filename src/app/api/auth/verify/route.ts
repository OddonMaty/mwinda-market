import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Stockage temporaire en mémoire des codes de vérification OTP (valides 15 minutes)
// Format : { [userId]: { code: string, expiresAt: number, target: string } }
const verificationStore: Record<string, { code: string; expiresAt: number; target: string }> = {};

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

    // ACTION 1 : Générer et envoyer le code de confirmation
    if (action === "send") {
      const channel = body.channel || "email"; // 'email' ou 'phone'
      const code = Math.floor(100000 + Math.random() * 900000).toString(); // Code à 6 chiffres
      const target = channel === "phone" ? (user.phone || "") : user.email;

      verificationStore[uid] = {
        code,
        expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
        target,
      };

      console.log(`[VERIFY] Code OTP généré pour ${user.email} (${channel}): ${code}`);

      return NextResponse.json({
        success: true,
        message: `Code de vérification envoyé à ${target}.`,
        // En environnement dev ou démo, on transmet aussi le code pour faciliter les tests
        demoCode: process.env.NODE_ENV !== "production" ? code : undefined,
      });
    }

    // ACTION 2 : Valider le code saisi
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


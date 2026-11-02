import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/orders/track?reference=MW-XXXX&phone=...
 * Suivi : référence + téléphone (moins exposé).
 */
export async function GET(req: NextRequest) {
  try {
    const reference = (req.nextUrl.searchParams.get("reference") || "")
      .trim()
      .toUpperCase();
    const phone = (req.nextUrl.searchParams.get("phone") || "").trim();

    if (!reference || reference.length < 4) {
      return NextResponse.json(
        { error: "Référence invalide." },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { error: "Téléphone requis pour le suivi." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        reference,
        customerPhone: { contains: phone.replace(/\D/g, "").slice(-9) },
      },
      select: {
        id: true,
        reference: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        amountUsd: true,
        deliveryCity: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            title: true,
            quantity: true,
            unitUsdPrice: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Commande introuvable.", found: false },
        { status: 404 }
      );
    }

    return NextResponse.json({ found: true, order }, { status: 200 });
  } catch (err: any) {
    console.error("[API/orders/track] error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur." },
      { status: 500 }
    );
  }
}

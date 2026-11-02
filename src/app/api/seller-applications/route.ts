import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.full_name?.trim() || !body.shop_name?.trim() || !body.phone?.trim() || !body.email?.trim()) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants." },
        { status: 400 }
      );
    }

    const app = await prisma.sellerApplication.create({
      data: {
        fullName: body.full_name.trim(),
        shopName: body.shop_name.trim(),
        phone: body.phone.trim(),
        email: body.email.trim(),
        category: body.category || null,
        location: body.location || null,
        notes: body.notes || null,
        status: "pending",
      },
    });

    return NextResponse.json({ success: true, id: app.id }, { status: 201 });
  } catch (err: any) {
    console.error("[API/seller-applications] error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur." },
      { status: 500 }
    );
  }
}

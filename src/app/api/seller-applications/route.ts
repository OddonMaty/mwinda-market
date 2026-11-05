import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const uid = req.cookies.get("mwinda_uid")?.value || null;

    if (!body.full_name?.trim() || !body.shop_name?.trim() || !body.phone?.trim() || !body.email?.trim()) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants (Nom, Boutique, Téléphone, Email)." },
        { status: 400 }
      );
    }

    // Structure des informations légales pour certification
    const legalDetails = [
      body.company_type ? `Forme Juridique: ${body.company_type}` : null,
      body.rccm ? `RCCM: ${body.rccm}` : null,
      body.id_nat ? `ID. NAT: ${body.id_nat}` : null,
      body.tax_id ? `NIF/Numéro Impôt: ${body.tax_id}` : null,
      body.manager_name ? `Gérant / Représentant: ${body.manager_name}` : null,
      body.manager_id ? `Pièce d'identité: ${body.manager_id}` : null,
      body.physical_address ? `Adresse Physique: ${body.physical_address}` : null,
      body.notes ? `Notes/Offre: ${body.notes}` : null,
    ].filter(Boolean).join(" | ");

    const app = await prisma.sellerApplication.create({
      data: {
        userId: uid,
        fullName: body.full_name.trim(),
        shopName: body.shop_name.trim(),
        phone: body.phone.trim(),
        email: body.email.trim(),
        category: body.category || null,
        location: body.location || body.physical_address || "Kinshasa",
        notes: legalDetails || body.notes || null,
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

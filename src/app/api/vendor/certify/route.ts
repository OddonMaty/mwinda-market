import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const uid = req.cookies.get("mwinda_uid")?.value;
    if (!uid) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: uid },
      include: { vendor: true },
    });

    if (!user?.vendor) {
      return NextResponse.json({ error: "Compte vendeur introuvable." }, { status: 403 });
    }

    const body = await req.json();
    const {
      companyType,
      rccm,
      idNat,
      taxId,
      managerName,
      managerIdCard,
      physicalAddress,
    } = body;

    if (!rccm?.trim() && !idNat?.trim()) {
      return NextResponse.json(
        { error: "Veuillez fournir au moins votre N° RCCM ou ID. NAT." },
        { status: 400 }
      );
    }

    if (!physicalAddress?.trim()) {
      return NextResponse.json(
        { error: "L'adresse physique de votre établissement est requise." },
        { status: 400 }
      );
    }

    // Mettre à jour l'adresse et les coordonnées sur le vendeur
    await prisma.vendor.update({
      where: { id: user.vendor.id },
      data: {
        address: physicalAddress.trim(),
      },
    });

    // Enregistrer le dossier légal de certification dans SellerApplication
    const legalNotes = JSON.stringify({
      certificationRequest: true,
      companyType: companyType || "ETS",
      rccm: rccm?.trim(),
      idNat: idNat?.trim(),
      taxId: taxId?.trim(),
      managerName: managerName?.trim() || user.name,
      managerIdCard: managerIdCard?.trim(),
      physicalAddress: physicalAddress?.trim(),
      submittedAt: new Date().toISOString(),
    });

    const existingApp = await prisma.sellerApplication.findFirst({
      where: {
        OR: [{ userId: user.id }, { email: user.email }],
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingApp) {
      await prisma.sellerApplication.update({
        where: { id: existingApp.id },
        data: {
          notes: `${existingApp.notes || ""} || CERTIFICATION_DOSSIER: ${legalNotes}`,
        },
      });
    } else {
      await prisma.sellerApplication.create({
        data: {
          userId: user.id,
          fullName: managerName?.trim() || user.name || "Gérant Boutique",
          shopName: user.vendor.shopName,
          phone: user.vendor.whatsapp || user.phone || "",
          email: user.email,
          location: user.vendor.city || "Kinshasa",
          notes: `CERTIFICATION_DOSSIER: ${legalNotes}`,
          status: "pending",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "Dossier légal transmis avec succès ! Nos équipes vérifient vos pièces sous 24h ouvrées.",
    });
  } catch (err: any) {
    console.error("[api/vendor/certify POST]", err);
    return NextResponse.json({ error: err.message || "Erreur serveur." }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const uid = req.cookies.get("mwinda_uid")?.value;
    if (!uid) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: uid },
      include: {
        vendor: {
          include: {
            _count: {
              select: {
                products: true,
                orders: true,
                withdrawals: true,
              },
            },
          },
        },
      },
    });

    if (!user) return NextResponse.json({ error: "Utilisateur non trouvé." }, { status: 404 });

    // Vérifier également s'il y a une candidature en attente si le vendeur n'est pas encore créé
    let application = null;
    if (!user.vendor) {
      application = await prisma.sellerApplication.findFirst({
        where: {
          OR: [
            { userId: user.id },
            { email: user.email },
          ],
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({
      vendor: user.vendor || null,
      application: application || null,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error("[api/vendor/profile GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const uid = req.cookies.get("mwinda_uid")?.value;
    if (!uid) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: uid },
      include: { vendor: true },
    });

    if (!user?.vendor) return NextResponse.json({ error: "Boutique introuvable." }, { status: 403 });

    const body = await req.json();
    const { shopName, tagline, whatsapp, address, city, logoUrl } = body;

    const updated = await prisma.vendor.update({
      where: { id: user.vendor.id },
      data: {
        shopName: shopName?.trim() || user.vendor.shopName,
        tagline: tagline?.trim() ?? user.vendor.tagline,
        whatsapp: whatsapp?.trim() ?? user.vendor.whatsapp,
        address: address?.trim() ?? user.vendor.address,
        city: city?.trim() ?? user.vendor.city,
        logoUrl: logoUrl?.trim() ?? user.vendor.logoUrl,
      },
    });

    return NextResponse.json({ success: true, vendor: updated });
  } catch (err: any) {
    console.error("[api/vendor/profile PUT]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


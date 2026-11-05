import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const uid = req.cookies.get("mwinda_uid")?.value;
    if (!uid) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: uid },
      include: { vendor: true },
    });

    if (!user?.vendor) return NextResponse.json({ products: [] });

    const products = await prisma.product.findMany({
      where: { vendorId: user.vendor.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (err: any) {
    console.error("[api/vendor/products GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const uid = req.cookies.get("mwinda_uid")?.value;
    if (!uid) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: uid },
      include: { vendor: true },
    });

    if (!user?.vendor) return NextResponse.json({ error: "Compte vendeur requis." }, { status: 403 });

    const body = await req.json();
    const { title, priceUsd, stock, description, imageUrl, category, province, city } = body;

    if (!title?.trim() || priceUsd == null || Number(priceUsd) < 0) {
      return NextResponse.json({ error: "Titre et prix requis." }, { status: 400 });
    }

    const productData: any = {
      vendorId: user.vendor.id,
      title: title.trim(),
      description: description || null,
      priceUsd: Number(priceUsd),
      stock: Number(stock) || 0,
      imageUrl: imageUrl || null,
      isActive: true,
    };

    if (category) productData.category = category;
    if (province) productData.province = province || user.vendor.city || "Kinshasa";
    if (city) productData.city = city || user.vendor.city || "Kinshasa";

    const product = await prisma.product.create({
      data: productData,
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (err: any) {
    console.error("[api/vendor/products POST]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const uid = req.cookies.get("mwinda_uid")?.value;
    if (!uid) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: uid },
      include: { vendor: true },
    });

    if (!user?.vendor) return NextResponse.json({ error: "Compte vendeur requis." }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID produit requis." }, { status: 400 });

    // Vérifier que le produit appartient bien au vendeur
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing || existing.vendorId !== user.vendor.id) {
      return NextResponse.json({ error: "Produit non autorisé." }, { status: 403 });
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[api/vendor/products DELETE]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

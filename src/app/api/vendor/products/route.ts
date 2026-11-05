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
    const { title, priceUsd, stock, description, imageUrl, images, category, province, city } = body;

    if (!title?.trim() || priceUsd == null || Number(priceUsd) < 0) {
      return NextResponse.json({ error: "Titre et prix requis." }, { status: 400 });
    }

    // Jusqu'à 5 images — imageUrl est la photo principale, images[] les suivantes
    const extraImages: string[] = Array.isArray(images)
      ? images.filter((u: string) => typeof u === "string" && u.trim()).slice(0, 5)
      : [];

    const productData: any = {
      vendorId: user.vendor.id,
      title: title.trim(),
      description: description || null,
      priceUsd: Number(priceUsd),
      stock: Number(stock) || 0,
      imageUrl: imageUrl?.trim() || null,
      images: extraImages,
      isActive: true,
    };

    if (category) productData.category = category;
    productData.province = province || user.vendor.city || "Kinshasa";
    productData.city = city || user.vendor.city || "Kinshasa";

    const product = await prisma.product.create({ data: productData });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (err: any) {
    console.error("[api/vendor/products POST]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const uid = req.cookies.get("mwinda_uid")?.value;
    if (!uid) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: uid },
      include: { vendor: true },
    });

    if (!user?.vendor) return NextResponse.json({ error: "Compte vendeur requis." }, { status: 403 });

    const body = await req.json();
    const { id, title, priceUsd, stock, description, imageUrl, images, category, province, city, isActive } = body;

    if (!id) return NextResponse.json({ error: "ID produit requis." }, { status: 400 });

    // Vérifier que le produit appartient bien au vendeur
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing || existing.vendorId !== user.vendor.id) {
      return NextResponse.json({ error: "Produit non autorisé." }, { status: 403 });
    }

    const extraImages: string[] = Array.isArray(images)
      ? images.filter((u: string) => typeof u === "string" && u.trim()).slice(0, 5)
      : existing.images;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        title: title?.trim() || existing.title,
        description: description !== undefined ? description : existing.description,
        priceUsd: priceUsd !== undefined ? Number(priceUsd) : existing.priceUsd,
        stock: stock !== undefined ? Number(stock) : existing.stock,
        imageUrl: imageUrl !== undefined ? imageUrl?.trim() || null : existing.imageUrl,
        images: extraImages,
        category: category || existing.category,
        province: province || existing.province,
        city: city || existing.city,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    console.error("[api/vendor/products PATCH]", err);
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

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const city = searchParams.get("city") || undefined;
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 20)));
    const skip = (page - 1) * limit;

    const productWhere: any = { isActive: true };

    if (q) {
      productWhere.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    if (minPrice != null || maxPrice != null) {
      productWhere.priceUsd = {};
      if (minPrice != null) productWhere.priceUsd.gte = minPrice;
      if (maxPrice != null) productWhere.priceUsd.lte = maxPrice;
    }

    if (city) {
      productWhere.vendor = { city: { equals: city, mode: "insensitive" } };
    }

    const [total, productsRaw] = await Promise.all([
      prisma.product.count({ where: productWhere }),
      prisma.product.findMany({
        where: productWhere,
        include: { vendor: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const products = productsRaw.map((p) => ({
      id: p.id,
      shopId: p.vendorId,
      shopName: p.vendor.shopName,
      title: p.title,
      description: p.description,
      usdPrice: Number(p.priceUsd),
      stockCount: p.stock,
      image: p.imageUrl || "/images/products/placeholder.jpg",
      inStock: p.stock > 0,
      city: p.vendor.city,
    }));

    const shops = await prisma.vendor.findMany({
      where: { isActive: true },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });

    const shopsMapped = shops.map((v) => ({
      id: v.id,
      name: v.shopName,
      city: v.city || "Kinshasa",
      verified: v.isVerified,
      productCount: v._count.products,
    }));

    return NextResponse.json({
      products,
      shops: shopsMapped,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      isLive: true,
    });
  } catch (err: any) {
    console.error("[api/catalog]", err);
    return NextResponse.json({ products: [], shops: [], isLive: false }, { status: 500 });
  }
}

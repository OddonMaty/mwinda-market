import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const vendors = await prisma.vendor.findMany({
      where: { isActive: true },
      include: {
        products: {
          where: { isActive: true },
          take: 50,
        },
      },
    });

    const shops = vendors.map((v) => ({
      id: v.id,
      name: v.shopName,
      city: v.city || "Kinshasa",
      verified: v.isVerified,
      productCount: v.products.length,
      products: v.products.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        priceUsd: Number(p.priceUsd),
        stock: p.stock,
        imageUrl: p.imageUrl,
      })),
    }));

    const products = vendors.flatMap((v) =>
      v.products.map((p) => ({
        id: p.id,
        shopId: v.id,
        shopName: v.shopName,
        title: p.title,
        description: p.description,
        usdPrice: Number(p.priceUsd),
        stockCount: p.stock,
        image: p.imageUrl || "/images/products/placeholder.jpg",
        inStock: p.stock > 0,
      }))
    );

    return NextResponse.json({ shops, products, isLive: true });
  } catch (err: any) {
    console.error("[api/catalog]", err);
    return NextResponse.json({ shops: [], products: [], isLive: false }, { status: 500 });
  }
}

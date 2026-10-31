import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const uid = req.cookies.get("mwinda_uid")?.value;
  if (!uid) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: uid },
    include: { vendor: true },
  });

  if (!user?.vendor) return NextResponse.json({ error: "Compte vendeur requis." }, { status: 403 });

  const body = await req.json();
  const { title, priceUsd, stock, description, imageUrl } = body;

  if (!title?.trim() || priceUsd == null || Number(priceUsd) < 0) {
    return NextResponse.json({ error: "Titre et prix requis." }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      vendorId: user.vendor.id,
      title: title.trim(),
      description: description || null,
      priceUsd: Number(priceUsd),
      stock: Number(stock) || 0,
      imageUrl: imageUrl || null,
      isActive: true,
    },
  });

  return NextResponse.json({ success: true, product }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = req.cookies.get("mwinda_uid")?.value;
  if (!uid) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user?.email) return NextResponse.json({ error: "Email manquant." }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { id: params.id, customerEmail: user.email },
    include: { items: true },
  });

  if (!order) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });

  if (order.status === "cancelled" || order.status === "delivered") {
    return NextResponse.json({ error: "Commande non annulable." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: params.id },
      data: { status: "cancelled" },
    });

    for (const item of order.items) {
      if (item.productId && item.quantity > 0) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
  });

  return NextResponse.json({ success: true });
}

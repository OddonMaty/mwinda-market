import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyStatusChange } from "@/lib/notify";

const ALLOWED = ["preparing", "shipped", "delivered", "cancelled"];

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = req.cookies.get("mwinda_uid")?.value;
  if (!uid) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: uid },
    include: { vendor: true },
  });

  if (!user?.vendor) {
    return NextResponse.json({ error: "Vendeur requis." }, { status: 403 });
  }

  const { status } = await req.json();
  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Statut non autorisé." }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: params.id, vendorId: user.vendor.id },
  });

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  }

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: { status },
  });

  await notifyStatusChange(params.id, status);

  return NextResponse.json({ success: true, order: updated });
}

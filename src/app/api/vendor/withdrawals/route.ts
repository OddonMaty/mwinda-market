import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const uid = req.cookies.get("mwinda_uid")?.value;
  if (!uid) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: uid },
    include: { vendor: true },
  });

  if (!user?.vendor) return NextResponse.json({ withdrawals: [] });

  const withdrawals = await prisma.withdrawal.findMany({
    where: { vendorId: user.vendor.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ withdrawals });
}

export async function POST(req: NextRequest) {
  const uid = req.cookies.get("mwinda_uid")?.value;
  if (!uid) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: uid },
    include: { vendor: true },
  });

  if (!user?.vendor) return NextResponse.json({ error: "Vendeur requis." }, { status: 403 });

  const { amountUsd, method, details } = await req.json();

  if (!amountUsd || amountUsd <= 0 || !method) {
    return NextResponse.json({ error: "Montant et méthode requis." }, { status: 400 });
  }

  const paidOrders = await prisma.order.findMany({
    where: { vendorId: user.vendor.id, paymentStatus: "paid" },
  });
  const totalEarned = paidOrders.reduce((s, o) => s + Number(o.vendorEarningUsd), 0);

  const activeWithdrawals = await prisma.withdrawal.findMany({
    where: { vendorId: user.vendor.id, status: { in: ["pending", "paid", "approved"] } },
  });
  const withdrawn = activeWithdrawals.reduce((s, w) => s + Number(w.amountUsd), 0);
  const available = totalEarned - withdrawn;

  if (amountUsd > available) {
    return NextResponse.json({ error: "Solde insuffisant." }, { status: 400 });
  }

  const withdrawal = await prisma.withdrawal.create({
    data: {
      vendorId: user.vendor.id,
      amountUsd,
      method,
      details: details || null,
      status: "pending",
    },
  });

  return NextResponse.json({ success: true, withdrawal }, { status: 201 });
}

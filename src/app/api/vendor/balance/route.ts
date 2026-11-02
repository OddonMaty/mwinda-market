import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const uid = req.cookies.get("mwinda_uid")?.value;
  if (!uid) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: uid },
    include: { vendor: true },
  });

  if (!user?.vendor) return NextResponse.json({ error: "Vendeur requis." }, { status: 403 });

  const paidOrders = await prisma.order.findMany({
    where: { vendorId: user.vendor.id, paymentStatus: "paid" },
  });

  const totalEarned = paidOrders.reduce((s, o) => s + Number(o.vendorEarningUsd), 0);
  const totalSales = paidOrders.reduce((s, o) => s + Number(o.amountUsd), 0);
  const totalCommission = paidOrders.reduce((s, o) => s + Number(o.commissionUsd), 0);

  const withdrawals = await prisma.withdrawal.findMany({
    where: { vendorId: user.vendor.id, status: { in: ["pending", "paid", "approved"] } },
  });

  const withdrawn = withdrawals.reduce((s, w) => s + Number(w.amountUsd), 0);
  const available = Math.max(0, totalEarned - withdrawn);

  return NextResponse.json({
    plan: user.vendor.plan,
    totalSales,
    totalCommission,
    totalEarned,
    withdrawn,
    available,
    ordersCount: paidOrders.length,
  });
}

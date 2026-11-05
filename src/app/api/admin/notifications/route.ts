import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [pendingOrders, pendingApplications, pendingWithdrawals, recentProducts] =
      await Promise.all([
        prisma.order.findMany({
          where: { paymentStatus: "pending", status: { not: "cancelled" } },
          orderBy: { createdAt: "desc" },
          take: 6,
          select: {
            id: true,
            reference: true,
            amountUsd: true,
            customerName: true,
            createdAt: true,
            paymentMethod: true,
          },
        }),
        prisma.sellerApplication.findMany({
          where: { status: "pending" },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            shopName: true,
            fullName: true,
            createdAt: true,
            location: true,
          },
        }),
        prisma.withdrawal.findMany({
          where: { status: "pending" },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            vendor: { select: { shopName: true } },
          },
        }),
        prisma.product.findMany({
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          take: 4,
          select: {
            id: true,
            title: true,
            priceUsd: true,
            createdAt: true,
            vendor: { select: { shopName: true } },
          },
        }),
      ]);

    const notifications: Array<{
      id: string;
      type: "order" | "application" | "withdrawal" | "product";
      title: string;
      description: string;
      time: string;
      href: string;
      priority: "high" | "normal";
    }> = [];

    // Notifications de commandes / paiements
    pendingOrders.forEach((o) => {
      notifications.push({
        id: `ord_${o.id}`,
        type: "order",
        title: `Nouvelle commande : ${o.reference}`,
        description: `Paiement ${Number(o.amountUsd).toFixed(2)}$ USD par ${o.customerName} (${o.paymentMethod === "manual_mm" ? "Mobile Money" : "Cash"})`,
        time: new Date(o.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        href: "/admin/commandes",
        priority: "high",
      });
    });

    // Notifications de boutiques candidates
    pendingApplications.forEach((a) => {
      notifications.push({
        id: `app_${a.id}`,
        type: "application",
        title: `Nouvelle boutique candidate : ${a.shopName}`,
        description: `Dossier légal soumis par ${a.fullName} (${a.location || "RDC"})`,
        time: new Date(a.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        href: "/admin/vendeurs",
        priority: "high",
      });
    });

    // Notifications de retraits vendeurs
    pendingWithdrawals.forEach((w) => {
      notifications.push({
        id: `wth_${w.id}`,
        type: "withdrawal",
        title: `Demande de retrait : ${Number(w.amountUsd).toFixed(2)}$ USD`,
        description: `Boutique ${w.vendor?.shopName || "Partenaire"} (${w.method} - ${w.details || ""})`,
        time: new Date(w.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        href: "/admin/retraits",
        priority: "high",
      });
    });

    // Nouveaux articles
    recentProducts.forEach((p) => {
      notifications.push({
        id: `prd_${p.id}`,
        type: "product",
        title: `Nouvel article publié : ${p.title}`,
        description: `${Number(p.priceUsd).toFixed(2)}$ USD • Boutique ${p.vendor?.shopName || "Mwinda"}`,
        time: new Date(p.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        href: "/admin/catalogue",
        priority: "normal",
      });
    });

    const totalUnread =
      pendingOrders.length + pendingApplications.length + pendingWithdrawals.length;

    return NextResponse.json({
      notifications,
      unreadCount: totalUnread,
      counts: {
        pendingOrders: pendingOrders.length,
        pendingApplications: pendingApplications.length,
        pendingWithdrawals: pendingWithdrawals.length,
        recentProducts: recentProducts.length,
      },
    });
  } catch (error: any) {
    console.error("[api/admin/notifications]", error);
    return NextResponse.json(
      { notifications: [], unreadCount: 0, error: error.message },
      { status: 500 }
    );
  }
}


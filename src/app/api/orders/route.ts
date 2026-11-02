import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyNewOrder } from "@/lib/notify";
import { calculateCommission } from "@/lib/commission";

export const dynamic = "force-dynamic";

export interface OrderPayload {
  reference: string;
  amount_usd: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  delivery_address: string;
  delivery_city?: string;
  payment_method?: string;
  payment_status?: string;
  status?: string;
  notes?: string;
  items: Array<{
    title: string;
    quantity: number;
    unit_usd_price: number;
    image?: string | null;
    product_id?: string | null;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const body: OrderPayload = await req.json();
    const uid = req.cookies.get("mwinda_uid")?.value || null;

    if (
      !body.reference ||
      !body.customer_name?.trim() ||
      !body.customer_phone?.trim() ||
      !body.delivery_address?.trim() ||
      body.amount_usd == null ||
      body.amount_usd < 0
    ) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants ou invalides." },
        { status: 400 }
      );
    }

    let vendorId: string | null = null;
    let plan = "starter";

    // 1. Recherche par identifiant de produit en base
    const firstProductId = body.items?.find((i) => i.product_id)?.product_id;
    if (firstProductId) {
      try {
        const product = await prisma.product.findUnique({
          where: { id: firstProductId },
          include: { vendor: true },
        });
        if (product) {
          vendorId = product.vendorId;
          plan = product.vendor.plan || "starter";
        }
      } catch {
        // En cas d'erreur de recherche
      }
    }

    // 2. Fallback : recherche du vendeur par nom de boutique si non trouvé par ID
    if (!vendorId) {
      const shopName = (body.items as any)?.find((i: any) => i.shop_name)?.shop_name;
      if (shopName) {
        try {
          const vendor = await prisma.vendor.findFirst({
            where: { shopName: { equals: shopName, mode: "insensitive" } },
          });
          if (vendor) {
            vendorId = vendor.id;
            plan = vendor.plan || "starter";
          }
        } catch {
          // Ignore
        }
      }
    }

    const { commissionUsd, vendorEarningUsd } = calculateCommission(body.amount_usd, plan);

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          reference: body.reference,
          amountUsd: body.amount_usd,
          commissionUsd,
          vendorEarningUsd,
          userId: uid,
          customerName: body.customer_name.trim(),
          customerPhone: body.customer_phone.trim(),
          customerEmail: body.customer_email || null,
          deliveryAddress: body.delivery_address.trim(),
          deliveryCity: body.delivery_city || "Kinshasa",
          paymentMethod: body.payment_method || "manual_mm",
          paymentStatus: body.payment_status || "pending",
          status: body.status || "pending_payment",
          notes: body.notes || null,
          vendorId,
          items: {
            create: (body.items || []).map((it) => ({
              title: it.title,
              quantity: it.quantity,
              unitUsdPrice: it.unit_usd_price,
              imageUrl: it.image || null,
              productId: it.product_id || null,
            })),
          },
        },
        include: { items: true },
      });

      for (const it of body.items || []) {
        if (it.product_id && it.quantity > 0) {
          try {
            await tx.product.update({
              where: { id: it.product_id },
              data: { stock: { decrement: it.quantity } },
            });
          } catch {
            // Si le produit n'existe pas en table PostgreSQL (ex. ID mock statique), on n'interrompt pas la commande
          }
        }
      }

      return created;
    });

    await notifyNewOrder({
      reference: order.reference,
      customerName: order.customerName,
      amountUsd: Number(order.amountUsd),
      vendorId: order.vendorId,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
    });

    return NextResponse.json(
      { success: true, orderId: order.id, reference: order.reference },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[API/orders] POST error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email") || "").trim();
    const phone = (searchParams.get("phone") || "").trim();

    if (!email && !phone) {
      return NextResponse.json({ error: "email ou phone requis." }, { status: 400 });
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          email ? { customerEmail: email } : undefined,
          phone ? { customerPhone: phone } : undefined,
        ].filter(Boolean) as any,
      },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (err: any) {
    console.error("[API/orders] GET error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur." },
      { status: 500 }
    );
  }
}

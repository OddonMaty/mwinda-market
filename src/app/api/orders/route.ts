import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// Client serveur avec Service Role (accès total, contourne les RLS)
// Cette route s'exécute UNIQUEMENT côté serveur, jamais dans le navigateur.
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // fallback pour les tests

  if (!url || !serviceKey) return null;
  return createClient<Database>(url, serviceKey);
}

export interface OrderPayload {
  reference: string;
  amount_usd: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  delivery_address: string;
  delivery_city?: string;
  country_code?: string;
  payment_method?: string;
  payment_status?: string;
  status?: string;
  notes?: string;
  items: Array<{
    title: string;
    quantity: number;
    unit_usd_price: number;
    image?: string | null;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const body: OrderPayload = await req.json();

    // Validation minimale
    if (
      !body.reference ||
      !body.customer_name ||
      !body.customer_phone ||
      !body.delivery_address ||
      body.amount_usd == null
    ) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants." },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();
    if (!supabase) {
      // Si pas de Supabase configuré, retourner succès pour le mode démo
      return NextResponse.json(
        { success: true, demo: true, orderId: null },
        { status: 200 }
      );
    }

    // 1. Insérer la commande
    const { data: orderData, error: orderErr } = await supabase
      .from("orders")
      .insert({
        reference: body.reference,
        amount_usd: body.amount_usd,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        customer_email: body.customer_email || null,
        delivery_address: body.delivery_address,
        delivery_city: body.delivery_city || "Kinshasa",
        country_code: body.country_code || "CD",
        payment_method: body.payment_method || "mpesa",
        payment_status: body.payment_status || "escrow_secured",
        status: body.status || "in_prep",
        notes: body.notes || null,
      })
      .select("id")
      .single();

    if (orderErr) {
      console.error("[API/orders] Order insert error:", orderErr.message);
      return NextResponse.json(
        { error: orderErr.message },
        { status: 500 }
      );
    }

    const orderId = orderData?.id;

    // 2. Insérer les articles si l'ordre a bien été créé
    if (orderId && body.items && body.items.length > 0) {
      const itemsPayload = body.items.map((it) => ({
        order_id: orderId,
        title: it.title,
        quantity: it.quantity,
        unit_usd_price: it.unit_usd_price,
        image: it.image || null,
      }));

      const { error: itemsErr } = await supabase
        .from("order_items")
        .insert(itemsPayload);

      if (itemsErr) {
        // Non-fatal : la commande est créée, on log seulement
        console.warn("[API/orders] Items insert warning:", itemsErr.message);
      }
    }

    return NextResponse.json(
      { success: true, orderId, reference: body.reference },
      { status: 201 }
    );
  } catch (err) {
    console.error("[API/orders] Unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur serveur inattendue." },
      { status: 500 }
    );
  }
}

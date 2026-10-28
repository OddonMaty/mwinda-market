import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

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

function requireSession(req: NextRequest): boolean {
  return Boolean(req.cookies.get("mwinda_session")?.value);
}

/** POST — créer une commande (service role, hors RLS client). */
export async function POST(req: NextRequest) {
  try {
    const body: OrderPayload = await req.json();

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

    const supabase = getServiceSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        {
          success: true,
          demo: true,
          orderId: null,
          warning:
            "SUPABASE_SERVICE_ROLE_KEY absente : commande non persistée en base.",
        },
        { status: 200 }
      );
    }

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
        payment_status: body.payment_status || "pending",
        status: body.status || "in_prep",
        notes: body.notes || null,
      })
      .select("id")
      .single();

    if (orderErr) {
      console.error("[API/orders] Order insert error:", orderErr.message);
      return NextResponse.json({ error: orderErr.message }, { status: 500 });
    }

    const orderId = orderData?.id;

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

/**
 * GET — lister les commandes d'un client (email et/ou téléphone).
 * Exige le cookie de session Mwinda (utilisateur connecté).
 */
export async function GET(req: NextRequest) {
  try {
    if (!requireSession(req)) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email") || "").trim();
    const phone = (searchParams.get("phone") || "").trim();

    if (!email && !phone) {
      return NextResponse.json(
        { error: "email ou phone requis." },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ orders: [], demo: true }, { status: 200 });
    }

    let query = supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (email && phone) {
      query = query.or(`customer_email.eq.${email},customer_phone.eq.${phone}`);
    } else if (email) {
      query = query.eq("customer_email", email);
    } else {
      query = query.eq("customer_phone", phone);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[API/orders] GET error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: data || [] }, { status: 200 });
  } catch (err) {
    console.error("[API/orders] GET unexpected:", err);
    return NextResponse.json(
      { error: "Erreur serveur inattendue." },
      { status: 500 }
    );
  }
}

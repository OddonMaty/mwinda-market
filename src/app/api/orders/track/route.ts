import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

/**
 * GET /api/orders/track?reference=MW-XXXX
 * Suivi public par référence de commande (service role, hors RLS).
 */
export async function GET(req: NextRequest) {
  try {
    const reference = (req.nextUrl.searchParams.get("reference") || "")
      .trim()
      .toUpperCase();

    if (!reference || reference.length < 4) {
      return NextResponse.json(
        { error: "Référence de commande invalide." },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Service de suivi indisponible.", demo: true },
        { status: 503 }
      );
    }

    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, reference, status, payment_status, payment_method, amount_usd, customer_name, delivery_city, delivery_address, country_code, created_at, updated_at, order_items(title, quantity, unit_usd_price, image)"
      )
      .eq("reference", reference)
      .maybeSingle();

    if (error) {
      console.error("[API/orders/track] error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Commande introuvable.", found: false },
        { status: 404 }
      );
    }

    return NextResponse.json({ found: true, order: data }, { status: 200 });
  } catch (err) {
    console.error("[API/orders/track] unexpected:", err);
    return NextResponse.json(
      { error: "Erreur serveur inattendue." },
      { status: 500 }
    );
  }
}

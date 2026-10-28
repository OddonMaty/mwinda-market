import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

interface SellerApplicationPayload {
  full_name: string;
  shop_name: string;
  category?: string | null;
  location?: string | null;
  phone: string;
  email: string;
  notes?: string | null;
  country_code?: string;
}

function requireSession(req: NextRequest): boolean {
  return Boolean(req.cookies.get("mwinda_session")?.value);
}

/** POST — enregistrer une candidature vendeur (service role). */
export async function POST(req: NextRequest) {
  try {
    if (!requireSession(req)) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const body: SellerApplicationPayload = await req.json();

    if (!body.full_name?.trim() || !body.shop_name?.trim() || !body.phone?.trim() || !body.email?.trim()) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants (full_name, shop_name, phone, email)." },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        {
          success: true,
          demo: true,
          id: null,
          warning:
            "SUPABASE_SERVICE_ROLE_KEY absente : candidature non persistée en base.",
        },
        { status: 200 }
      );
    }

    const { data, error } = await supabase
      .from("seller_applications")
      .insert({
        full_name: body.full_name.trim(),
        shop_name: body.shop_name.trim(),
        category: body.category || null,
        location: body.location || null,
        phone: body.phone.trim(),
        email: body.email.trim(),
        notes: body.notes || null,
        country_code: body.country_code || "CD",
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[API/seller-applications] insert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, id: data?.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("[API/seller-applications] Unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur serveur inattendue." },
      { status: 500 }
    );
  }
}

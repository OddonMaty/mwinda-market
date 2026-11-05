import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Handler GET : pour le retour officiel Google OAuth
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state") || "/";

    if (!code) {
      return NextResponse.redirect(new URL("/connexion?error=Google_Auth_Failed", req.url));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const origin = req.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/google/callback`;

    // Échange du code contre tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId || "",
        client_secret: clientSecret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      throw new Error("Impossible d'échanger le code Google.");
    }

    const tokens = await tokenRes.json();

    // Récupérer le profil utilisateur Google
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      throw new Error("Impossible de récupérer les informations de profil Google.");
    }

    const googleUser = await userRes.json();
    const email = googleUser.email?.toLowerCase();
    const name = googleUser.name || email.split("@")[0];

    // Trouver ou créer l'utilisateur
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          role: "customer",
          emailVerified: new Date(), // Automatiquement vérifié par Google
        },
      });
    } else if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    }

    const res = NextResponse.redirect(new URL(state.startsWith("/") ? state : "/", req.url));
    res.cookies.set("mwinda_uid", user.id, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return res;
  } catch (err: any) {
    console.error("[api/auth/google/callback GET]", err);
    return NextResponse.redirect(new URL("/connexion?error=Google_Error", req.url));
  }
}

// Handler POST : pour le formulaire de connexion instantanée Google sans API keys
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = (formData.get("email") as string || "").trim().toLowerCase();
    const name = (formData.get("name") as string || "").trim() || email.split("@")[0];
    const redirectPath = (formData.get("redirect") as string || "/");

    if (!email || !email.includes("@")) {
      return NextResponse.redirect(new URL("/connexion?error=Invalid_Email", req.url));
    }

    // Trouver ou créer l'utilisateur en base
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          role: "customer",
          emailVerified: new Date(), // Vérifié par Google
        },
      });
    } else if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    }

    const destination = redirectPath.startsWith("/") ? redirectPath : "/";
    const res = NextResponse.redirect(new URL(destination, req.url));
    res.cookies.set("mwinda_uid", user.id, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return res;
  } catch (err: any) {
    console.error("[api/auth/google/callback POST]", err);
    return NextResponse.redirect(new URL("/connexion?error=Server_Error", req.url));
  }
}


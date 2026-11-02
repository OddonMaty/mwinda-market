import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/mon-compte") ||
    pathname.startsWith("/panier/checkout") ||
    pathname.startsWith("/vendeur/dashboard");

  const isAdmin = pathname.startsWith("/admin");

  const uid = request.cookies.get("mwinda_uid")?.value;

  if (isProtected && !uid) {
    const loginUrl = new URL("/connexion", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdmin) {
    // Protection basique : présence du cookie + token optionnel
    // En production, vérifier le rôle admin via une route ou un claim
    const adminToken = request.cookies.get("mwinda_admin")?.value;
    const expected = process.env.ADMIN_ACCESS_TOKEN || "change-me-admin";

    if (!uid) {
      return NextResponse.redirect(new URL("/connexion?redirect=/admin", request.url));
    }

    // Si un token admin est défini, l'exiger
    if (process.env.ADMIN_ACCESS_TOKEN && adminToken !== expected) {
      return NextResponse.redirect(new URL("/connexion?error=admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/mon-compte/:path*",
    "/vendeur/dashboard/:path*",
    "/panier/checkout/:path*",
    "/admin/:path*",
  ],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes nécessitant une connexion
const PROTECTED_ROUTES = ["/mon-compte", "/panier/checkout"];
// Routes exclusivement vendeur
const VENDOR_ROUTES = ["/vendeur/dashboard"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vérifier si c'est une route protégée
  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isVendorRoute = VENDOR_ROUTES.some((r) => pathname.startsWith(r));

  if (isProtected || isVendorRoute) {
    // Lire le cookie de session Supabase (cookie name pattern for Next.js)
    const sessionCookie =
      request.cookies.get("sb-access-token") ||
      request.cookies.get("supabase-auth-token");

    // Fallback: vérifier via un cookie custom qu'on posera lors de la connexion
    const mwindaSession = request.cookies.get("mwinda_session");

    if (!sessionCookie && !mwindaSession) {
      const loginUrl = new URL("/connexion", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/mon-compte/:path*", "/vendeur/dashboard/:path*", "/panier/checkout/:path*"],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/mon-compte", "/panier/checkout"];
const VENDOR_ROUTES = ["/vendeur/dashboard"];
const ADMIN_ROUTES = ["/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isVendorRoute = VENDOR_ROUTES.some((r) => pathname.startsWith(r));
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));

  if (isProtected || isVendorRoute) {
    const mwindaSession = request.cookies.get("mwinda_session");
    if (!mwindaSession) {
      const loginUrl = new URL("/connexion", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protection basique temporaire de /admin
  // Remplacer par une vraie auth admin dès que possible
  if (isAdminRoute) {
    const adminToken = request.cookies.get("mwinda_admin")?.value;
    const expected = process.env.ADMIN_ACCESS_TOKEN || "change-me-admin";
    if (adminToken !== expected) {
      // Pour le moment on laisse passer en dév ; en prod mettre un vrai login
      // return NextResponse.redirect(new URL("/connexion?admin=1", request.url));
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

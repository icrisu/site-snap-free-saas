import createMiddleware from "next-intl/middleware";
import { routing, locales } from "./i18n/routing";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);
const protectedPaths = ["/dashboard", "/profile"];

// --- regex to detect locale in URL ---
const localePattern = new RegExp(`^\\/(${locales.join("|")})(?:\\/|$)`);

export default auth((req: NextRequest & { auth: unknown }) => {
  
  const { pathname } = req.nextUrl;

  // --- Protected routes ---
  const pathWithoutLocale = pathname.replace(localePattern, "") || "/";
  const isProtected = protectedPaths.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + "/")
  );

  if (isProtected && !req.auth) {
    const signInUrl = new URL("/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }


  // --- Let next-intl handle locale detection and redirect ---
  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
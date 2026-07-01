import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Páginas públicas (acessíveis sem login). As páginas legais/compliance
  // PRECISAM ser públicas para a validação das lojas (Google Play / App Store).
  const PUBLIC_PATHS = [
    "/",
    "/simple-test",
    "/privacidade",
    "/termos",
    "/lgpd",
    "/suporte",
    "/excluir-conta",
    "/produto-convoca",
    "/impressum",
  ];

  // Fast path checks before auth call
  const isPublicPage =
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PATHS.some((p) => p !== "/" && pathname.startsWith(`${p}/`));
  const isApiRoute = pathname.startsWith("/api");
  const isAuthPage = pathname.startsWith("/auth");
  const isErrorPage = pathname === "/auth/error";
  // /.well-known/** deve ser público: Apple (AASA) e Google (assetlinks)
  // fazem GET sem autenticação para validar Universal Links / App Links.
  const isWellKnown = pathname.startsWith("/.well-known");

  // Skip auth check for public pages, API routes and well-known endpoints
  if (isPublicPage || isApiRoute || isWellKnown) {
    return NextResponse.next();
  }

  // Only call auth when necessary
  const session = await auth();
  const isLoggedIn = !!session;

  // Redirect unauthenticated users to signin (except on auth pages)
  if (!isLoggedIn && !isAuthPage) {
    const url = new URL("/auth/signin", req.url);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from signin/signup pages (but allow error page)
  if (isLoggedIn && isAuthPage && !isErrorPage) {
    const url = new URL("/dashboard", req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

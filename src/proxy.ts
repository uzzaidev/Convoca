import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Fast path checks before auth call
  const isPublicPage = pathname === "/" || pathname === "/simple-test";
  const isApiRoute = pathname.startsWith("/api");
  const isAuthPage = pathname.startsWith("/auth");
  const isErrorPage = pathname === "/auth/error";

  // Skip auth check for public pages and API routes
  if (isPublicPage || isApiRoute) {
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

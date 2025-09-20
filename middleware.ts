import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { TOKEN_COOKIE } from "@/lib/constants"

// Demo-only auth protection using a client-visible cookie.
// Do NOT use this in production.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Static files and api routes pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get(TOKEN_COOKIE)?.value
  const isAuthed = Boolean(token)

  const isAuthRoute = pathname === "/login" || pathname.startsWith("/(auth)/login")
  const isAppRoute =
    pathname.startsWith("/(app)") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/quotes") ||
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/clients") ||
    pathname.startsWith("/settings")

  // Redirect unauthenticated users away from protected app routes
  if (isAppRoute && !isAuthed) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login page
  if (isAuthRoute && isAuthed) {
    const url = req.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/(app)/:path*",
    "/dashboard",
    "/quotes",
    "/invoices",
    "/clients",
    "/settings",
    "/login",
  ],
}
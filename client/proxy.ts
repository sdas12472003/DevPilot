import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// REMOVED: import { AUTH_COOKIE } from "@/hooks/use-auth"
// Next.js proxy runs on Edge Runtime. Importing from files containing 
// React hooks/TanStack Query breaks the proxy silently.

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // FIX: Hardcode the exact string here to bypass the Edge import crash
  const authCookie = request.cookies.get("devpilot_auth")
  const isAuthenticated = authCookie?.value === "1"

  // Allow access to auth callback without being authenticated
  if (pathname.startsWith("/auth/callback")) {
    return NextResponse.next()
  }

  // Redirect to login if accessing protected routes without authentication
  if ((pathname.startsWith("/dashboard") || pathname.startsWith("/chat")) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to dashboard if trying to access login while already authenticated
  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/chat/:path*",
    "/login",
    "/auth/callback"
  ],
}
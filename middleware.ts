import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { TOKEN_COOKIE } from "@/lib/constants"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sgbrlqcquoydwgugaiqn.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnYnJscWNxdW95ZHdndWdhaXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODg4NjksImV4cCI6MjA3Mzg2NDg2OX0.QdfVq-AWsAoufIWe0d4OyursigMHYcerrqVezp7LhKs"

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Temporary bypass authentication for testing dashboard
  console.log("Middleware check (bypassed for testing):", { pathname })
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/(app)/:path*",
    "/dashboard",
    "/quotes",
    "/invoices",
    "/clients",
    "/profile",
    "/settings",
    "/login",
  ],
}
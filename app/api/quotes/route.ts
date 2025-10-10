import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sgbrlqcquoydwgugaiqn.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnYnJscWNxdW95ZHdndWdhaXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODg4NjksImV4cCI6MjA3Mzg2NDg2OX0.QdfVq-AWsAoufIWe0d4OyursigMHYcerrqVezp7LhKs"

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase
      .from("quotes")
      .select(`
        id,
        quote_number,
        total_incl_vat,
        status,
        created_at,
        clients (
          id,
          name,
          company
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error('Error fetching quotes:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const quotes = data?.map(quote => ({
      id: quote.id,
      quote_number: quote.quote_number,
      total_incl_vat: quote.total_incl_vat || 0,
      status: quote.status,
      created_at: quote.created_at,
      clients: quote.clients ? {
        name: (quote.clients as any).name,
        company: (quote.clients as any).company
      } : null
    })) || []

    return NextResponse.json({ quotes })
  } catch (error) {
    console.error('Error in quotes API:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
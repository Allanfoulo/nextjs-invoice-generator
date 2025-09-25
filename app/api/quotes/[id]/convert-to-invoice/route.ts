import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sgbrlqcquoydwgugaiqn.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnYnJscWNxdW95ZHdndWdhaXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODg4NjksImV4cCI6MjA3Mzg2NDg2OX0.QdfVq-AWsAoufIWe0d4OyursigMHYcerrqVezp7LhKs"
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    // Get the auth token from the request header
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Verify the token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const quoteId = id

    // Call the RPC function to convert quote to invoice
    const { data: conversionResult, error: conversionError } = await supabase
      .rpc('convert_quote_to_invoice', {
        p_quote_id: quoteId
      })

    if (conversionError) {
      console.error('Error converting quote to invoice:', conversionError)
      return NextResponse.json(
        { error: conversionError.message || 'Failed to convert quote to invoice' },
        { status: 500 }
      )
    }

    // The RPC returns a table, so we need to get the first row
    const result = conversionResult[0]

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

    // Fetch the created invoice with related data
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*),
        company:companies(*),
        invoice_items(
          *,
          item:items(*)
        )
      `)
      .eq('id', result.invoice_id)
      .single()

    if (invoiceError) {
      console.error('Error fetching created invoice:', invoiceError)
      return NextResponse.json(
        { error: 'Invoice created but failed to fetch details' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      invoice
    })

  } catch (error) {
    console.error('Unexpected error in quote to invoice conversion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
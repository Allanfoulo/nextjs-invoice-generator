import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sgbrlqcquoydwgugaiqn.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnYnJscWNxdW95ZHdndWdhaXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODg4NjksImV4cCI6MjA3Mzg2NDg2OX0.QdfVq-AWsAoufIWe0d4OyursigMHYcerrqVezp7LhKs"
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(
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

    // Fetch quote with related data
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        client:clients(*),
        company_settings(*),
        created_by_user:users(*),
        quote_items(
          *,
          item:items(*)
        )
      `)
      .eq('id', quoteId)
      .single()

    if (quoteError || !quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to access this quote
    if (quote.created_by_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Generate HTML for the quote
    const htmlContent = generateQuoteHTML(quote)

    // Return HTML as response for client-side PDF generation
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'X-PDF-Filename': `quote-${quote.quote_number}.pdf`,
      },
    })

  } catch (error) {
    console.error('Error generating quote PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

function generateQuoteHTML(quote: {
  quote_number: string
  date_issued: string
  valid_until: string
  subtotal_excl_vat: number
  vat_amount: number
  total_incl_vat: number
  deposit_percentage: number
  deposit_amount: number
  balance_remaining: number
  status: string
  notes?: string
  company_settings: {
    company_name: string
    address: string
    email: string
    phone: string
    currency?: string
    vat_percentage?: number
    terms_text?: string
  }
  client: {
    name: string
    company: string
    email: string
    phone: string
    vat_number?: string
  }
  quote_items: Array<{
    item: {
      description: string
      unit?: string
    }
    quantity: number
    unit_price: number
    total_price: number
  }>
}): string {
  const company = quote.company_settings
  const client = quote.client
  const items = quote.quote_items

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: company.currency || 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #333;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
        <div>
          <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #2563eb;">QUOTE</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">#${quote.quote_number}</p>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold;">${company.company_name}</h2>
          <p style="margin: 5px 0; font-size: 12px;">${company.address}</p>
          <p style="margin: 5px 0; font-size: 12px;">${company.email}</p>
          <p style="margin: 5px 0; font-size: 12px;">${company.phone}</p>
        </div>
      </div>

      <!-- Dates -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div>
          <p style="margin: 5px 0; font-size: 12px;"><strong>Date Issued:</strong> ${formatDate(quote.date_issued)}</p>
        </div>
        <div>
          <p style="margin: 5px 0; font-size: 12px;"><strong>Valid Until:</strong> ${formatDate(quote.valid_until)}</p>
        </div>
      </div>

      <!-- Bill To -->
      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #374151;">Bill To:</h3>
        <p style="margin: 5px 0; font-size: 14px; font-weight: bold;">${client.name}</p>
        <p style="margin: 5px 0; font-size: 12px;">${client.company}</p>
        <p style="margin: 5px 0; font-size: 12px;">${client.email}</p>
        <p style="margin: 5px 0; font-size: 12px;">${client.phone}</p>
        ${client.vat_number ? `<p style="margin: 5px 0; font-size: 12px;">VAT: ${client.vat_number}</p>` : ''}
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 12px; font-weight: bold;">Description</th>
            <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; font-size: 12px; font-weight: bold;">Qty</th>
            <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; font-size: 12px; font-weight: bold;">Unit Price</th>
            <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; font-size: 12px; font-weight: bold;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item: {
            item: {
              description: string
              unit?: string
            }
            quantity: number
            unit_price: number
            total_price: number
          }) => `
            <tr>
              <td style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 12px;">
                ${item.item.description}
                ${item.item.unit ? `<span style="color: #666; font-size: 10px;"> (${item.item.unit})</span>` : ''}
              </td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${item.quantity}</td>
              <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${formatCurrency(item.unit_price)}</td>
              <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${formatCurrency(item.total_price)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Summary -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
        <div style="width: 300px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="font-size: 14px;">Subtotal:</span>
            <span style="font-size: 14px;">${formatCurrency(quote.subtotal_excl_vat)}</span>
          </div>
          ${quote.vat_amount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-size: 14px;">VAT (${company.vat_percentage || 15}%):</span>
              <span style="font-size: 14px;">${formatCurrency(quote.vat_amount)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px solid #374151;">
            <span style="font-size: 16px; font-weight: bold;">Total:</span>
            <span style="font-size: 16px; font-weight: bold;">${formatCurrency(quote.total_incl_vat)}</span>
          </div>
          ${quote.deposit_percentage > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-top: 10px;">
              <span style="font-size: 12px; color: #666;">Deposit (${quote.deposit_percentage}%):</span>
              <span style="font-size: 12px; color: #666;">${formatCurrency(quote.deposit_amount)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 5px;">
              <span style="font-size: 12px; color: #666;">Balance Remaining:</span>
              <span style="font-size: 12px; color: #666;">${formatCurrency(quote.balance_remaining)}</span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Terms and Notes -->
      ${company.terms_text ? `
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #374151;">Terms & Conditions</h4>
          <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #666;">${company.terms_text}</p>
        </div>
      ` : ''}
      ${quote.notes ? `
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #374151;">Notes</h4>
          <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #666;">${quote.notes}</p>
        </div>
      ` : ''}

      <!-- Status -->
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500;
          ${quote.status === 'draft' ? 'background-color: #e5e7eb; color: #111827;' : ''}
          ${quote.status === 'sent' ? 'background-color: #dbeafe; color: #1e40af;' : ''}
          ${quote.status === 'accepted' ? 'background-color: #d1fae5; color: #065f46;' : ''}
          ${quote.status === 'declined' ? 'background-color: #fee2e2; color: #991b1b;' : ''}
          ${quote.status === 'expired' ? 'background-color: #fef3c7; color: #92400e;' : ''}">
          Status: ${quote.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #666;">
        <p>Thank you for your business!</p>
        <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </div>
  `
}
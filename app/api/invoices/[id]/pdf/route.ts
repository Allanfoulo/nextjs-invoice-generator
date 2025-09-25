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

    const invoiceId = id

    // Fetch invoice with related data
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*),
        company:companies(*),
        user:users(*),
        invoice_items(
          *,
          item:items(*)
        )
      `)
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to access this invoice
    if (invoice.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Generate HTML for the invoice
    const htmlContent = generateInvoiceHTML(invoice)

    // Return HTML as response for client-side PDF generation
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'X-PDF-Filename': `invoice-${invoice.invoice_number}.pdf`,
      },
    })

  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

function generateInvoiceHTML(invoice: any): string {
  const company = invoice.company
  const client = invoice.client
  const items = invoice.invoice_items

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
          <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #2563eb;">INVOICE</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">#${invoice.invoice_number}</p>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold;">${company.name}</h2>
          <p style="margin: 5px 0; font-size: 12px;">${company.address || ''}</p>
          <p style="margin: 5px 0; font-size: 12px;">${company.city || ''}, ${company.state || ''} ${company.zip_code || ''}</p>
          <p style="margin: 5px 0; font-size: 12px;">${company.email || ''}</p>
          <p style="margin: 5px 0; font-size: 12px;">${company.phone || ''}</p>
        </div>
      </div>

      <!-- Bill To -->
      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #374151;">Bill To:</h3>
        <p style="margin: 5px 0; font-size: 14px; font-weight: bold;">${client.name}</p>
        <p style="margin: 5px 0; font-size: 12px;">${client.address || ''}</p>
        <p style="margin: 5px 0; font-size: 12px;">${client.city || ''}, ${client.state || ''} ${client.zip_code || ''}</p>
        <p style="margin: 5px 0; font-size: 12px;">${client.email || ''}</p>
        <p style="margin: 5px 0; font-size: 12px;">${client.phone || ''}</p>
      </div>

      <!-- Invoice Details -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div>
          <p style="margin: 5px 0; font-size: 12px;"><strong>Issue Date:</strong> ${formatDate(invoice.issue_date)}</p>
          <p style="margin: 5px 0; font-size: 12px;"><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</p>
        </div>
        <div>
          <p style="margin: 5px 0; font-size: 12px;"><strong>Status:</strong> ${invoice.status}</p>
          <p style="margin: 5px 0; font-size: 12px;"><strong>Quote Reference:</strong> ${invoice.created_from_quote_id ? '#' + invoice.created_from_quote_id : 'N/A'}</p>
        </div>
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
          ${items.map((item: any) => `
            <tr>
              <td style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 12px;">
                ${item.item.name}
                ${item.item.description ? `<br><span style="color: #666; font-size: 10px;">${item.item.description}</span>` : ''}
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
            <span style="font-size: 14px;">${formatCurrency(invoice.subtotal)}</span>
          </div>
          ${invoice.tax_amount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-size: 14px;">Tax:</span>
              <span style="font-size: 14px;">${formatCurrency(invoice.tax_amount)}</span>
            </div>
          ` : ''}
          ${invoice.discount_amount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-size: 14px;">Discount:</span>
              <span style="font-size: 14px;">-${formatCurrency(invoice.discount_amount)}</span>
            </div>
          ` : ''}
          ${invoice.deposit_amount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-size: 14px;">Deposit (${invoice.deposit_percentage}%):</span>
              <span style="font-size: 14px;">-${formatCurrency(invoice.deposit_amount)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px solid #374151;">
            <span style="font-size: 16px; font-weight: bold;">Total:</span>
            <span style="font-size: 16px; font-weight: bold;">${formatCurrency(invoice.total_amount)}</span>
          </div>
        </div>
      </div>

      <!-- Terms and Notes -->
      ${invoice.terms ? `
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #374151;">Terms & Conditions</h4>
          <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #666;">${invoice.terms}</p>
        </div>
      ` : ''}
      ${invoice.notes ? `
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #374151;">Notes</h4>
          <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #666;">${invoice.notes}</p>
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #666;">
        <p>Thank you for your business!</p>
        <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </div>
  `
}
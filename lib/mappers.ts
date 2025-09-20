import { supabase } from "@/lib/supabase"
import {
  CompanySettings,
  Client,
  Quote,
  Invoice,
  Item,
  QuoteStatus,
  InvoiceStatus,
} from "@/lib/invoice-types"

function toItem(row: any): Item {
  return {
    id: row.id,
    description: row.description,
    unitPrice: row.unit_price,
    qty: row.qty,
    taxable: row.taxable,
    itemType: row.item_type,
    unit: row.unit,
    createdAt: row.created_at,
  }
}

export function mapSettingsRow(row: any): CompanySettings {
  return {
    id: row.id,
    companyName: row.company_name,
    address: row.address,
    email: row.email,
    phone: row.phone,
    logoUrl: row.logo_url,
    currency: row.currency,
    vatPercentage: row.vat_percentage,
    numberingFormatInvoice: row.numbering_format_invoice,
    numberingFormatQuote: row.numbering_format_quote,
    nextQuoteNumber: row.next_quote_number,
    nextInvoiceNumber: row.next_invoice_number,
    termsText: row.terms_text,
    paymentInstructions: row.payment_instructions,
  }
}

export function mapClientRow(row: any): Client {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    email: row.email,
    billingAddress: row.billing_address,
    deliveryAddress: row.delivery_address,
    vatNumber: row.vat_number ?? undefined,
    phone: row.phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapQuoteRow(row: any): Quote {
  const items =
    (row.quote_items as any[])?.map((qi) => toItem(qi.items)).flat() ?? []

  return {
    id: row.id,
    quoteNumber: row.quote_number,
    createdByUserId: row.created_by_user_id,
    dateIssued: row.date_issued,
    validUntil: row.valid_until,
    clientId: row.client_id,
    items,
    subtotalExclVat: row.subtotal_excl_vat,
    vatAmount: row.vat_amount,
    totalInclVat: row.total_incl_vat,
    depositPercentage: row.deposit_percentage ?? 0,
    depositAmount: row.deposit_amount ?? 0,
    balanceRemaining:
      row.balance_remaining ?? (row.total_incl_vat ?? 0) - (row.deposit_amount ?? 0),
    status: row.status as QuoteStatus,
    termsText: row.terms_text ?? "",
    notes: row.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapInvoiceRow(row: any): Invoice {
  const items =
    (row.invoice_items as any[])?.map((ii) => toItem(ii.items)).flat() ?? []

  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    createdByUserId: row.created_by_user_id,
    dateIssued: row.date_issued,
    dueDate: row.due_date,
    clientId: row.client_id,
    items,
    subtotalExclVat: row.subtotal_excl_vat,
    vatAmount: row.vat_amount,
    totalInclVat: row.total_incl_vat,
    depositRequired: row.deposit_required,
    depositAmount: row.deposit_amount,
    balanceRemaining: row.balance_remaining,
    status: row.status as InvoiceStatus,
    paymentInstructions: row.payment_instructions,
    createdFromQuoteId: row.created_from_quote_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function fetchCompanySettings(): Promise<CompanySettings | null> {
  const { data, error } = await supabase.from("company_settings").select("*").limit(1)
  if (error) {
    console.error("fetchCompanySettings error:", error)
    return null
  }
  if (!data || data.length === 0) return null
  return mapSettingsRow(data[0])
}

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase.from("clients").select("*")
  if (error) {
    console.error("fetchClients error:", error)
    return []
  }
  return (data ?? []).map(mapClientRow)
}

export async function fetchQuotes(): Promise<Quote[]> {
  const { data, error } = await supabase
    .from("quotes")
    .select("*, quote_items(items(*))")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("fetchQuotes error:", error)
    return []
  }
  return (data ?? []).map(mapQuoteRow)
}

export async function fetchInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*, invoice_items(items(*))")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("fetchInvoices error:", error)
    return []
  }
  return (data ?? []).map(mapInvoiceRow)
}

// Utilities for UI
export function formatDateISO(dateStr: string | Date) {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr
  return new Date(d).toLocaleDateString("en-CA")
}

export function formatCurrency(amount: number, currency = "ZAR") {
  try {
    return new Intl.NumberFormat("en-ZA", { style: "currency", currency }).format(amount ?? 0)
  } catch {
    return `${currency} ${Number(amount ?? 0).toFixed(2)}`
  }
}

export function humanizeStatus(status: string) {
  return status.replace(/_/g, " ")
}
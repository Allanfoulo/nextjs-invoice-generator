"use client"

import * as React from "react"
import { useEffect, useMemo, useState, useTransition, Suspense } from "react"
import { m } from "@/components/ui/motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Search, Download, Eye } from "lucide-react"
import { AnimatePresence } from "framer-motion"
import { InlineSpinner } from "@/components/ui/inline-spinner"
import { fetchClients, fetchCompanySettings, fetchInvoices, formatCurrency, formatDateISO, humanizeStatus } from "@/lib/mappers"
import { getToken } from "@/lib/auth"
import type { Client, CompanySettings, Invoice } from "@/lib/invoice-types"
import { InvoiceEditor } from "./_components/invoice-editor"

export default function InvoicesPage() {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])

  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"all" | Invoice["status"]>("all")
  const [isPending, startUiTransition] = useTransition()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const [s, cs, is] = await Promise.all([fetchCompanySettings(), fetchClients(), fetchInvoices()])
        if (!mounted) return
        console.log("Debug - fetched data:", { settings: s, clients: cs, invoices: is })
        setSettings(s)
        setClients(cs)
        setInvoices(is)
      } catch (e) {
        console.error("Error loading invoices:", e)
        toast.error("Failed to load invoices")
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const filtered = useMemo(() => {
    return invoices.filter((i) => {
      const client = clients.find((c) => c.id === i.clientId)
      const text = `${i.invoiceNumber} ${client?.company ?? ""}`.toLowerCase()
      const matchesQuery = text.includes(query.toLowerCase())
      const matchesStatus = status === "all" ? true : i.status === status
      return matchesQuery && matchesStatus
    })
  }, [invoices, clients, query, status])

  function statusBadgeVariant(s: Invoice["status"]) {
    switch (s) {
      case "paid":
        return "default" as const
      case "overdue":
        return "destructive" as const
      case "partially_paid":
        return "secondary" as const
      case "sent":
        return "secondary" as const
      case "draft":
      default:
        return "secondary" as const
    }
  }

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setEditorOpen(true)
  }

  const handleSaveInvoice = (invoice: Invoice) => {
    setInvoices(prev => prev.map(i => i.id === invoice.id ? invoice : i))
    setEditorOpen(false)
    setEditingInvoice(null)
  }

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const token = getToken()
      if (!token) {
        toast.error("Authentication required")
        return
      }

      // Dynamically import jsPDF and html2canvas for client-side use
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ])

      // Get HTML from API
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate PDF')
      }

      const htmlContent = await response.text()

      // Create a temporary div to render HTML
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = htmlContent
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      tempDiv.style.width = '800px'
      document.body.appendChild(tempDiv)

      try {
        // Convert HTML to canvas
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
        })

        // Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4')
        const imgData = canvas.toDataURL('image/png')

        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)

        // Download the PDF
        const pdfBlob = pdf.output('blob')
        const url = URL.createObjectURL(pdfBlob)

        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoice.invoiceNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        // Clean up
        URL.revokeObjectURL(url)
        toast.success('PDF downloaded successfully')
      } finally {
        // Clean up temp div
        document.body.removeChild(tempDiv)
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Failed to download PDF')
    }
  }

  return (
    <m.div
      className="space-y-6"
      initial={{ opacity: 0, y: 4, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0)" }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Browse and manage invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                aria-label="Search invoices"
                placeholder="Search by invoice # or client"
                className="pl-8 pr-8 transition-[border-color,box-shadow] duration-150"
                value={query}
                onChange={(e) =>
                  startUiTransition(() => {
                    setQuery(e.target.value)
                  })
                }
              />
              <div className="absolute right-2.5 top-2.5 text-muted-foreground">
                <AnimatePresence>{isPending && <InlineSpinner size={14} />}</AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="status-filter" className="sr-only">
                Status filter
              </label>
              <Select
                value={status}
                onValueChange={(v) =>
                  startUiTransition(() => {
                    setStatus(v as "all" | Invoice["status"])
                  })
                }
              >
                <SelectTrigger id="status-filter" className="w-44">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="partially_paid">Partially paid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grow" />
          </div>

          <Separator />

          {/* Table */}
          <Suspense fallback={<div className="rounded-md border p-6 text-sm text-muted-foreground">Loading…</div>}>
            <ResponsiveTable
              headers={["Invoice #", "Client", "Date", "Due Date", "Total", "Status", "Quote", "Actions"]}
              data={filtered.map((i) => {
                const client = clients.find((c) => c.id === i.clientId)
                return {
                  id: i.id,
                  cells: [
                    <span key="invoice" className="font-medium">{i.invoiceNumber}</span>,
                    client?.company ?? "—",
                    formatDateISO(i.dateIssued),
                    formatDateISO(i.dueDate),
                    <span key="total" className="font-mono">
                      {formatCurrency(i.totalInclVat, settings?.currency ?? "ZAR")}
                    </span>,
                    <Badge key="status" variant={statusBadgeVariant(i.status)} className="capitalize">
                      {humanizeStatus(i.status)}
                    </Badge>,
                    <span key="quote" className="text-sm text-muted-foreground">
                      {i.createdFromQuoteId ? `#${i.createdFromQuoteId}` : "—"}
                    </span>,
                    <div key="actions" className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPDF(i)}
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditInvoice(i)}
                        title="Edit Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  ]
                }
              })}
              loading={loading}
              emptyMessage="No invoices found"
            />
          </Suspense>
        </CardContent>
      </Card>

      <InvoiceEditor
        invoice={editingInvoice}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSaved={handleSaveInvoice}
      />
    </m.div>
  )
}
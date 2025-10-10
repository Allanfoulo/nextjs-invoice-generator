'use client'

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Download,
  Mail,
  ArrowLeft,
  Settings,
  Loader2,
  FileText,
  Palette
} from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { cn } from "@/lib/utils"
import type { Invoice, Client, CompanySettings } from "@/lib/invoice-types"
import { InvoiceStatus } from "@/lib/invoice-types"
import { InvoiceTemplate } from "@/lib/pdf-templates/invoice-template"
import { TemplateEngine, TemplateStyle } from "@/lib/pdf-templates/template-engine"
import { TemplateSelector } from "@/components/ui/template-selector"
import { EmailDialog } from "@/components/ui/email-dialog"
import { fetchInvoiceById } from "@/lib/mappers"
import { supabase } from "@/lib/supabase"

export default function InvoicePreviewPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateStyle>("modern")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const templateRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const invoiceData = await fetchInvoiceById(invoiceId, user.id)
        if (!invoiceData) {
          router.push('/invoices')
          return
        }

        setInvoice(invoiceData.invoice)
        setClient(invoiceData.client)
        setSettings(invoiceData.settings)
      } catch (error) {
        console.error('Error loading invoice:', error)
        router.push('/invoices')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [invoiceId, router])

  const generateAndDownloadPDF = async () => {
    if (!templateRef.current || !invoice || !client || !settings) return

    setIsGenerating(true)
    try {
      const canvas = await html2canvas(templateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        allowTaint: false
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")

      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Direct download
      const pdfBlob = pdf.output("blob")
      const url = URL.createObjectURL(pdfBlob)

      const link = document.createElement("a")
      link.href = url
      link.download = `invoice-${invoice.invoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading invoice preview...</p>
        </div>
      </div>
    )
  }

  if (!invoice || !client || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Invoice not found</p>
          <Button onClick={() => router.push('/invoices')} className="mt-4">
            Back to Invoices
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Invoice Preview</h1>
                <p className="text-sm text-gray-500">
                  {invoice.invoiceNumber} • {client.company}
                </p>
              </div>
              <Badge variant={invoice.status === InvoiceStatus.Draft ? "secondary" : "default"}>
                {invoice.status.replace("_", " ").toUpperCase()}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <TemplateSelector
                currentStyle={selectedTemplate}
                onStyleChange={setSelectedTemplate}
                documentType="invoice"
              >
                <Button variant="outline" size="sm">
                  <Palette className="h-4 w-4 mr-2" />
                  Template
                </Button>
              </TemplateSelector>

              {invoice.status !== InvoiceStatus.Draft && (
                <EmailDialog
                  document={invoice}
                  documentType="invoice"
                  client={client}
                  settings={settings}
                >
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                </EmailDialog>
              )}

              <Button
                onClick={generateAndDownloadPDF}
                disabled={isGenerating}
                size="sm"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Invoice Number</p>
                  <p className="font-medium">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Client</p>
                  <p className="font-medium">{client.company}</p>
                  <p className="text-sm text-gray-600">{client.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date Issued</p>
                  <p className="font-medium">{new Date(invoice.dateIssued).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Due Date</p>
                  <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Amount</p>
                  <p className="font-medium text-lg">{settings.currency} {invoice.totalInclVat.toFixed(2)}</p>
                </div>
                {invoice.depositRequired && invoice.depositAmount > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Deposit Paid</p>
                    <p className="font-medium">{settings.currency} {invoice.depositAmount.toFixed(2)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Template</p>
                  <Badge variant="outline" className="capitalize">
                    {selectedTemplate}
                  </Badge>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge className={cn(
                    "mt-1",
                    invoice.status === InvoiceStatus.Draft && "bg-gray-200 text-gray-900",
                    invoice.status === InvoiceStatus.Sent && "bg-blue-200 text-blue-900",
                    invoice.status === InvoiceStatus.PartiallyPaid && "bg-yellow-200 text-yellow-900",
                    invoice.status === InvoiceStatus.Paid && "bg-green-200 text-green-900",
                    invoice.status === InvoiceStatus.Overdue && "bg-red-200 text-red-900"
                  )}>
                    {invoice.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Preview
                </CardTitle>
                <p className="text-sm text-gray-500">
                  This is how your invoice will look when downloaded or emailed
                </p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-300px)] w-full border rounded-lg bg-white">
                  <div className="flex justify-center p-8">
                    <div className="max-w-4xl w-full">
                      <div ref={templateRef}>
                        <InvoiceTemplate
                          invoice={invoice}
                          client={client}
                          settings={settings}
                          template={selectedTemplate}
                          isDraft={invoice.status === InvoiceStatus.Draft}
                        />
                      </div>
                    </div>
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
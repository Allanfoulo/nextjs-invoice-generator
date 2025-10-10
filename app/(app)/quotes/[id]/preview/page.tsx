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
  Palette,
  FilePlus,
  AlertCircle
} from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { cn } from "@/lib/utils"
import type { Quote, Client, CompanySettings } from "@/lib/invoice-types"
import { QuoteStatus } from "@/lib/invoice-types"
import { QuoteTemplate } from "@/lib/pdf-templates/quote-template"
import { TemplateEngine, TemplateStyle } from "@/lib/pdf-templates/template-engine"
import { TemplateSelector } from "@/components/ui/template-selector"
import { EmailDialog } from "@/components/ui/email-dialog"
import { fetchQuoteById } from "@/lib/mappers"
import { supabase } from "@/lib/supabase"
import { getSLAStatusForQuote, generateSLAForQuote, isQuoteEligibleForSLA, getSLABadgeVariant } from "@/lib/sla-helpers"
import { SLAPDFPreview } from "@/components/ui/sla-pdf-preview"
import type { ServiceAgreement } from "@/lib/sla-types"
import { toast } from "sonner"

export default function QuotePreviewPage() {
  const params = useParams()
  const router = useRouter()
  const quoteId = params.id as string

  const [quote, setQuote] = useState<Quote | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateStyle>("modern")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [sla, setSla] = useState<ServiceAgreement | null>(null)
  const [isGeneratingSLA, setIsGeneratingSLA] = useState(false)
  const [showSLAPreview, setShowSLAPreview] = useState(false)
  const templateRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("QuotePreviewPage: Starting data load for quoteId:", quoteId)

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError) {
          console.error("QuotePreviewPage: Auth error:", authError)
          router.push('/login')
          return
        }

        if (!user) {
          console.log("QuotePreviewPage: No user found, redirecting to login")
          router.push('/login')
          return
        }

        console.log("QuotePreviewPage: User found:", { userId: user.id, email: user.email })

        const quoteData = await fetchQuoteById(quoteId, user.id)
        if (!quoteData) {
          console.log("QuotePreviewPage: No quote data returned, redirecting to quotes")
          router.push('/quotes')
          return
        }

        console.log("QuotePreviewPage: Quote data loaded successfully")
        setQuote(quoteData.quote)
        setClient(quoteData.client)
        setSettings(quoteData.settings)

        // Load SLA status for this quote
        try {
          const slaStatus = await getSLAStatusForQuote(quoteId)
          setSla(slaStatus.sla || null)
        } catch (slaError) {
          console.error("QuotePreviewPage: Error checking SLA status:", slaError)
        }
      } catch (error) {
        console.error('QuotePreviewPage: Error loading quote:', error)
        router.push('/quotes')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [quoteId, router])

  const generateAndDownloadPDF = async () => {
    if (!templateRef.current || !quote || !client || !finalSettings) return

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
      link.download = `quote-${quote.quoteNumber}.pdf`
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

  const handleGenerateSLA = async () => {
    if (!quote) return

    try {
      setIsGeneratingSLA(true)

      // Check eligibility
      const eligibility = isQuoteEligibleForSLA(quote)
      if (!eligibility.eligible) {
        toast.error(eligibility.reason || "Quote is not eligible for SLA generation")
        return
      }

      // Generate SLA
      const result = await generateSLAForQuote(quote.id, 'manual')

      if (result.success && result.sla) {
        toast.success(`SLA ${result.sla.agreement_number} generated successfully!`)
        setSla(result.sla)
        setShowSLAPreview(true)
      } else {
        toast.error(result.error || "Failed to generate SLA")
      }
    } catch (error) {
      console.error('Error generating SLA:', error)
      toast.error("An unexpected error occurred while generating SLA")
    } finally {
      setIsGeneratingSLA(false)
    }
  }

  const handleViewSLA = () => {
    if (sla) {
      setShowSLAPreview(true)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading quote preview...</p>
        </div>
      </div>
    )
  }

  if (!quote || !client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Quote not found</p>
          <Button onClick={() => router.push('/quotes')} className="mt-4">
            Back to Quotes
          </Button>
        </div>
      </div>
    )
  }

  // Provide default settings if none exist
  const defaultSettings: CompanySettings = {
    id: '',
    companyName: 'Your Company',
    address: '123 Business St, City, Country',
    email: 'info@company.com',
    phone: '+27 21 123 4567',
    logoUrl: null,
    currency: 'ZAR',
    vatPercentage: 15,
    numberingFormatInvoice: 'INV-{YYYY}-{NUMBER}',
    numberingFormatQuote: 'Q-{YYYY}-{NUMBER}',
    nextInvoiceNumber: 1,
    nextQuoteNumber: 1,
    termsText: 'Payment due within 30 days.',
    paymentInstructions: {
      bank: '',
      accountName: '',
      accountNumber: '',
      branchCode: '',
      swift: ''
    }
  }

  const finalSettings = settings || defaultSettings

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
                <h1 className="text-xl font-semibold">Quote Preview</h1>
                <p className="text-sm text-gray-500">
                  {quote.quoteNumber} • {client.company}
                </p>
              </div>
              <Badge variant={quote.status === QuoteStatus.Draft ? "secondary" : "default"}>
                {quote.status.replace("_", " ").toUpperCase()}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <TemplateSelector
                currentStyle={selectedTemplate}
                onStyleChange={setSelectedTemplate}
                documentType="quote"
              >
                <Button variant="outline" size="sm">
                  <Palette className="h-4 w-4 mr-2" />
                  Template
                </Button>
              </TemplateSelector>

              {/* SLA Actions */}
              {sla ? (
                <Button variant="outline" size="sm" onClick={handleViewSLA} className="text-blue-600 border-blue-600 hover:bg-blue-50">
                  <FileText className="h-4 w-4 mr-2" />
                  View SLA
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateSLA}
                  disabled={isGeneratingSLA}
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  {isGeneratingSLA ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FilePlus className="h-4 w-4 mr-2" />
                  )}
                  Generate SLA
                </Button>
              )}

              {quote.status !== QuoteStatus.Draft && (
                <EmailDialog
                  document={quote}
                  documentType="quote"
                  client={client}
                  settings={finalSettings}
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
                  Quote Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Quote Number</p>
                  <p className="font-medium">{quote.quoteNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Client</p>
                  <p className="font-medium">{client.company}</p>
                  <p className="text-sm text-gray-600">{client.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date Issued</p>
                  <p className="font-medium">{new Date(quote.dateIssued).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Valid Until</p>
                  <p className="font-medium">{new Date(quote.validUntil).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Amount</p>
                  <p className="font-medium text-lg">{finalSettings.currency} {quote.totalInclVat.toFixed(2)}</p>
                </div>
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
                    quote.status === QuoteStatus.Draft && "bg-gray-200 text-gray-900",
                    quote.status === QuoteStatus.Sent && "bg-blue-200 text-blue-900",
                    quote.status === QuoteStatus.Accepted && "bg-green-200 text-green-900",
                    quote.status === QuoteStatus.Declined && "bg-red-200 text-red-900",
                    quote.status === QuoteStatus.Expired && "bg-yellow-200 text-yellow-900"
                  )}>
                    {quote.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>

                <Separator />

                {/* SLA Status */}
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Service Level Agreement</p>
                  {sla ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{sla.agreement_number}</span>
                        <Badge variant={getSLABadgeVariant(sla.status)} className="text-xs">
                          {sla.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleViewSLA} className="w-full">
                        <FileText className="h-3 w-3 mr-2" />
                        View SLA
                      </Button>
                      {sla.auto_generated && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Auto-generated
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        No SLA generated
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateSLA}
                        disabled={isGeneratingSLA || !isQuoteEligibleForSLA(quote).eligible}
                        className="w-full"
                      >
                        {isGeneratingSLA ? (
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        ) : (
                          <FilePlus className="h-3 w-3 mr-2" />
                        )}
                        Generate SLA
                      </Button>
                      {!isQuoteEligibleForSLA(quote).eligible && quote.status !== 'sent' && quote.status !== 'accepted' && (
                        <p className="text-xs text-muted-foreground">
                          Quote must be sent or accepted to generate SLA
                        </p>
                      )}
                    </div>
                  )}
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
                  This is how your quote will look when downloaded or emailed
                </p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-300px)] w-full border rounded-lg bg-white">
                  <div className="flex justify-center p-8">
                    <div className="max-w-4xl w-full">
                      <div ref={templateRef}>
                        <QuoteTemplate
                          quote={quote}
                          client={client}
                          settings={finalSettings}
                          template={selectedTemplate}
                          isDraft={quote.status === QuoteStatus.Draft}
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

      {/* SLA Preview Dialog */}
      {sla && client && finalSettings && (
        <SLAPDFPreview
          serviceAgreement={sla}
          client={client}
          settings={finalSettings}
          isOpen={showSLAPreview}
          onOpenChange={setShowSLAPreview}
        />
      )}
    </div>
  )
}
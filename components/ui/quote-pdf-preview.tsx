"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Download,
  Eye,
  Loader2,
  FileText
} from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { cn } from "@/lib/utils"
import type { Quote, Client, CompanySettings } from "@/lib/invoice-types"
import { QuoteStatus } from "@/lib/invoice-types"

interface QuotePDFPreviewProps {
  quote: Quote
  client: Client
  settings: CompanySettings
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}


function QuotePDFContent({ quote, client, settings }: { quote: Quote; client: Client; settings: CompanySettings }) {
  return (
    <div id="quote-pdf-content" className="bg-white p-8 max-w-4xl mx-auto shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quote</h1>
          <p className="text-lg text-gray-600 mt-1">{quote.quoteNumber}</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-semibold text-gray-900">{settings.companyName}</h2>
          <p className="text-gray-600">{settings.address}</p>
          <p className="text-gray-600">{settings.email}</p>
          <p className="text-gray-600">{settings.phone}</p>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <p className="text-sm text-gray-500">Date Issued</p>
          <p className="font-medium">{new Date(quote.dateIssued).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Valid Until</p>
          <p className="font-medium">{new Date(quote.validUntil).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Client Info */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Bill To:</h3>
        <div>
          <p className="font-medium">{client.company}</p>
          <p className="text-gray-600">{client.name}</p>
          <p className="text-gray-600">{client.email}</p>
          <p className="text-gray-600">{client.phone}</p>
          <p className="text-gray-600">{client.billingAddress}</p>
          {client.vatNumber && (
            <p className="text-gray-600">VAT: {client.vatNumber}</p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 px-2">Description</th>
              <th className="text-right py-2 px-2">Qty</th>
              <th className="text-right py-2 px-2">Unit Price</th>
              <th className="text-right py-2 px-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-3 px-2">
                  <div>
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-gray-500">{item.unit}</p>
                  </div>
                </td>
                <td className="py-3 px-2 text-right">{item.qty}</td>
                <td className="py-3 px-2 text-right">
                  {settings.currency} {item.unitPrice.toFixed(2)}
                </td>
                <td className="py-3 px-2 text-right font-medium">
                  {settings.currency} {(item.qty * item.unitPrice).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="flex justify-end mb-8">
        <div className="w-80">
          <div className="flex justify-between py-2">
            <span>Subtotal:</span>
            <span>{settings.currency} {quote.subtotalExclVat.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2">
            <span>VAT ({settings.vatPercentage}%):</span>
            <span>{settings.currency} {quote.vatAmount.toFixed(2)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between py-2 font-bold text-lg">
            <span>Total:</span>
            <span>{settings.currency} {quote.totalInclVat.toFixed(2)}</span>
          </div>
          {quote.depositPercentage > 0 && (
            <>
              <Separator className="my-2" />
              <div className="flex justify-between py-2">
                <span>Deposit ({quote.depositPercentage}%):</span>
                <span>{settings.currency} {quote.depositAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 font-medium">
                <span>Balance:</span>
                <span>{settings.currency} {quote.balanceRemaining.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Terms */}
      {quote.termsText && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">Terms & Conditions</h3>
          <p className="text-gray-600 whitespace-pre-wrap">{quote.termsText}</p>
        </div>
      )}

      {/* Notes */}
      {quote.notes && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">Notes</h3>
          <p className="text-gray-600 whitespace-pre-wrap">{quote.notes}</p>
        </div>
      )}

      {/* Status */}
      <div className="text-center">
        <span className={cn(
          "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
          quote.status === "draft" && "bg-gray-200 text-gray-900",
          quote.status === "sent" && "bg-blue-200 text-blue-900",
          quote.status === "accepted" && "bg-green-200 text-green-900",
          quote.status === "declined" && "bg-red-200 text-red-900",
          quote.status === "expired" && "bg-yellow-200 text-yellow-900"
        )}>
          Status: {quote.status.replace("_", " ").toUpperCase()}
        </span>
      </div>
    </div>
  )
}

export function QuotePDFPreview({
  quote,
  client,
  settings,
  isOpen,
  onOpenChange
}: QuotePDFPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const generateAndDownloadPDF = async () => {
    if (!contentRef.current) return

    setIsGenerating(true)
    try {
      const canvas = await html2canvas(contentRef.current, {
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

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Quote Preview - {quote.quoteNumber}
            </DialogTitle>
            <Button
              size="sm"
              onClick={generateAndDownloadPDF}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 p-6 overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div className="flex justify-center p-4">
              <div className="bg-white rounded-lg shadow-lg">
                <QuotePDFContent quote={quote} client={client} settings={settings} />
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
'use client'

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Mail, Send, Loader2, FileText, Eye } from "lucide-react"
import { EmailService, EmailConfig, EmailData } from "@/lib/email-service"
import type { Invoice, Quote, Client, CompanySettings } from "@/lib/invoice-types"
import { TemplateEngine, TemplateStyle } from "@/lib/pdf-templates/template-engine"
import { InvoiceTemplate } from "@/lib/pdf-templates/invoice-template"
import { QuoteTemplate } from "@/lib/pdf-templates/quote-template"

interface EmailDialogProps {
  document: Invoice | Quote
  documentType: "invoice" | "quote"
  client: Client
  settings: CompanySettings
  children: React.ReactNode
}

export function EmailDialog({ document, documentType, client, settings, children }: EmailDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [emailData, setEmailData] = useState({
    to: client.email,
    cc: "",
    bcc: "",
    subject: "",
    body: ""
  })
  const [emailConfig] = useState<EmailConfig>({
    provider: "resend", // Default to Resend
    apiKey: process.env.NEXT_PUBLIC_RESEND_API_KEY
  })
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateStyle>("modern")
  const [showPreview, setShowPreview] = useState(false)
  const templateRef = useRef<HTMLDivElement>(null)

  const emailService = new EmailService(emailConfig)

  // Initialize email data based on document type
  const initializeEmailData = () => {
    if (documentType === "invoice") {
      const invoice = document as Invoice
      setEmailData({
        to: client.email,
        cc: "",
        bcc: "",
        subject: `Invoice #${invoice.invoiceNumber} from ${settings.companyName}`,
        body: EmailService.generateInvoiceEmailBody(invoice, client, settings)
      })
    } else {
      const quote = document as Quote
      setEmailData({
        to: client.email,
        cc: "",
        bcc: "",
        subject: `Quote #${quote.quoteNumber} from ${settings.companyName}`,
        body: EmailService.generateQuoteEmailBody(quote, client, settings)
      })
    }
  }

  const handleSendEmail = async () => {
    if (!templateRef.current) return

    setIsSending(true)
    try {
      // Generate PDF attachment
      let pdfBlob: Blob
      let filename: string

      if (documentType === "invoice") {
        const invoice = document as Invoice
        pdfBlob = await EmailService.generateInvoicePDF(invoice, client, settings, templateRef.current)
        filename = `invoice-${invoice.invoiceNumber}.pdf`
      } else {
        const quote = document as Quote
        pdfBlob = await EmailService.generateQuotePDF(quote, client, settings, templateRef.current)
        filename = `quote-${quote.quoteNumber}.pdf`
      }

      const emailPayload: EmailData = {
        ...emailData,
        attachments: [{
          filename,
          content: pdfBlob,
          mimeType: "application/pdf"
        }]
      }

      const result = await emailService.sendEmail(emailPayload)

      if (result.success) {
        setIsOpen(false)
        // Show success message (you could integrate with a toast system here)
        alert(result.message || "Email sent successfully!")
      } else {
        alert(`Failed to send email: ${result.error}`)
      }
    } catch (error) {
      console.error("Error sending email:", error)
      alert("Failed to send email. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (open) {
      initializeEmailData()
    }
    setIsOpen(open)
    setShowPreview(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send {documentType === "invoice" ? "Invoice" : "Quote"} Email
          </DialogTitle>
          <DialogDescription>
            Send {documentType === "invoice" ? "invoice" : "quote"} #{documentType === "invoice" ? (document as Invoice).invoiceNumber : (document as Quote).quoteNumber} to {client.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-4">
          {/* Email Composition */}
          <div className="flex-1 flex flex-col">
            <Card className="flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Email Details</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="to">To</Label>
                  <Input
                    id="to"
                    type="email"
                    value={emailData.to}
                    onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                    placeholder="client@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cc">CC (optional)</Label>
                  <Input
                    id="cc"
                    type="email"
                    value={emailData.cc}
                    onChange={(e) => setEmailData({ ...emailData, cc: e.target.value })}
                    placeholder="cc@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                    placeholder="Email subject"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Message</Label>
                  <Textarea
                    id="body"
                    value={emailData.body}
                    onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                    placeholder="Email message"
                    rows={8}
                    className="min-h-[200px]"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Template: {selectedTemplate}
                    </Badge>
                    <Badge variant="outline">
                      Provider: {emailConfig.provider}
                    </Badge>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showPreview ? "Hide Preview" : "Show Preview"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PDF Preview */}
          {showPreview && (
            <div className="flex-1 border-l">
              <div className="p-4 border-b">
                <h3 className="font-semibold">PDF Preview</h3>
                <p className="text-sm text-gray-600">This PDF will be attached to your email</p>
              </div>
              <div className="p-4 overflow-auto">
                <div className="bg-white rounded shadow-sm">
                  <div ref={templateRef}>
                    {documentType === "invoice" ? (
                      <InvoiceTemplate
                        invoice={document as Invoice}
                        client={client}
                        settings={settings}
                        template={selectedTemplate}
                        isDraft={false}
                      />
                    ) : (
                      <QuoteTemplate
                        quote={document as Quote}
                        client={client}
                        settings={settings}
                        template={selectedTemplate}
                        isDraft={false}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendEmail} disabled={isSending || !emailData.to.trim()}>
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
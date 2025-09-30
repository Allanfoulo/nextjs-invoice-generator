import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import type { Invoice, Quote, Client, CompanySettings } from "@/lib/invoice-types"

export interface EmailAttachment {
  filename: string
  content: Blob
  mimeType: string
}

export interface EmailData {
  to: string
  cc?: string
  bcc?: string
  subject: string
  body: string
  attachments: EmailAttachment[]
}

export interface EmailConfig {
  provider: "resend" | "sendgrid" | "smtp"
  apiKey?: string
  smtpConfig?: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }
}

export class EmailService {
  private config: EmailConfig

  constructor(config: EmailConfig) {
    this.config = config
  }

  async sendEmail(emailData: EmailData): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      switch (this.config.provider) {
        case "resend":
          return await this.sendViaResend(emailData)
        case "sendgrid":
          return await this.sendViaSendGrid(emailData)
        case "smtp":
          return await this.sendViaSMTP(emailData)
        default:
          return { success: false, error: "Unsupported email provider" }
      }
    } catch (error) {
      console.error("Email sending failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }
    }
  }

  private async sendViaResend(emailData: EmailData): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!this.config.apiKey) {
      return { success: false, error: "Resend API key is required" }
    }

    const formData = new FormData()
    formData.append("from", "noreply@yourcompany.com")
    formData.append("to", emailData.to)
    if (emailData.cc) formData.append("cc", emailData.cc)
    if (emailData.bcc) formData.append("bcc", emailData.bcc)
    formData.append("subject", emailData.subject)
    formData.append("html", emailData.body)

    // Add attachments
    for (const attachment of emailData.attachments) {
      formData.append("attachments", attachment.content, attachment.filename)
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.config.apiKey}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `Resend API error: ${error}` }
    }

    return { success: true, message: "Email sent successfully via Resend" }
  }

  private async sendViaSendGrid(emailData: EmailData): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!this.config.apiKey) {
      return { success: false, error: "SendGrid API key is required" }
    }

    const attachments = await Promise.all(
      emailData.attachments.map(async (attachment) => {
        const base64 = await this.blobToBase64(attachment.content)
        return {
          content: base64.split(",")[1], // Remove data URL prefix
          filename: attachment.filename,
          type: attachment.mimeType,
          disposition: "attachment"
        }
      })
    )

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: emailData.to }],
          cc: emailData.cc ? [{ email: emailData.cc }] : undefined,
          bcc: emailData.bcc ? [{ email: emailData.bcc }] : undefined,
        }],
        from: { email: "noreply@yourcompany.com" },
        subject: emailData.subject,
        content: [{
          type: "text/html",
          value: emailData.body
        }],
        attachments
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `SendGrid API error: ${error}` }
    }

    return { success: true, message: "Email sent successfully via SendGrid" }
  }

  private async sendViaSMTP(emailData: EmailData): Promise<{ success: boolean; message?: string; error?: string }> {
    // This would require a server-side implementation for security
    // For now, we'll return a placeholder response
    return {
      success: false,
      error: "SMTP sending requires server-side implementation. Please use Resend or SendGrid for client-side sending."
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  static async generateInvoicePDF(
    invoice: Invoice,
    client: Client,
    settings: CompanySettings,
    templateElement: HTMLElement
  ): Promise<Blob> {
    const canvas = await html2canvas(templateElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      allowTaint: false
    })

    const pdf = new jsPDF("p", "mm", "a4")
    const imgData = canvas.toDataURL("image/png")

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

    return pdf.output("blob")
  }

  static async generateQuotePDF(
    quote: Quote,
    client: Client,
    settings: CompanySettings,
    templateElement: HTMLElement
  ): Promise<Blob> {
    const canvas = await html2canvas(templateElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      allowTaint: false
    })

    const pdf = new jsPDF("p", "mm", "a4")
    const imgData = canvas.toDataURL("image/png")

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

    return pdf.output("blob")
  }

  static generateInvoiceEmailBody(
    invoice: Invoice,
    client: Client,
    settings: CompanySettings
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice from ${settings.companyName}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .content { background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .btn { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Invoice from ${settings.companyName}</h2>
              <p>Invoice #${invoice.invoiceNumber}</p>
            </div>

            <div class="content">
              <p>Dear ${client.name},</p>

              <p>Please find attached your invoice #${invoice.invoiceNumber} for ${settings.currency} ${invoice.totalInclVat.toFixed(2)}.</p>

              <p><strong>Invoice Details:</strong></p>
              <ul>
                <li>Invoice Number: ${invoice.invoiceNumber}</li>
                <li>Date Issued: ${new Date(invoice.dateIssued).toLocaleDateString()}</li>
                <li>Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</li>
                <li>Amount Due: ${settings.currency} ${invoice.totalInclVat.toFixed(2)}</li>
              </ul>

              <p>Please review the attached invoice and let us know if you have any questions.</p>

              <p>Thank you for your business!</p>

              <p>Best regards,<br>
              ${settings.companyName}<br>
              ${settings.email}<br>
              ${settings.phone}</p>
            </div>

            <div class="footer">
              <p>This email was sent from ${settings.companyName}. If you believe this was sent in error, please contact us at ${settings.email}.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  static generateQuoteEmailBody(
    quote: Quote,
    client: Client,
    settings: CompanySettings
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Quote from ${settings.companyName}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .content { background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .btn { display: inline-block; background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Quote from ${settings.companyName}</h2>
              <p>Quote #${quote.quoteNumber}</p>
            </div>

            <div class="content">
              <p>Dear ${client.name},</p>

              <p>Please find attached your quote #${quote.quoteNumber} for ${settings.currency} ${quote.totalInclVat.toFixed(2)}.</p>

              <p><strong>Quote Details:</strong></p>
              <ul>
                <li>Quote Number: ${quote.quoteNumber}</li>
                <li>Date Issued: ${new Date(quote.dateIssued).toLocaleDateString()}</li>
                <li>Valid Until: ${new Date(quote.validUntil).toLocaleDateString()}</li>
                <li>Total Amount: ${settings.currency} ${quote.totalInclVat.toFixed(2)}</li>
              </ul>

              <p>This quote is valid until ${new Date(quote.validUntil).toLocaleDateString()}. Please review the attached quote and let us know if you have any questions or would like to proceed.</p>

              <p>We look forward to working with you!</p>

              <p>Best regards,<br>
              ${settings.companyName}<br>
              ${settings.email}<br>
              ${settings.phone}</p>
            </div>

            <div class="footer">
              <p>This email was sent from ${settings.companyName}. If you believe this was sent in error, please contact us at ${settings.email}.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }
}
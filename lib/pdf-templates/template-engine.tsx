import type { Invoice, Quote, Client, CompanySettings } from "@/lib/invoice-types"
import { InvoiceTemplate } from "./invoice-template"
import { QuoteTemplate } from "./quote-template"
import type { ReactElement } from "react"

export type TemplateStyle = "modern" | "classic" | "minimal"
export type DocumentType = "invoice" | "quote"

interface TemplateConfig {
  style: TemplateStyle
  showWatermark: boolean
  customColors?: {
    primary?: string
    secondary?: string
    accent?: string
  }
  customLogo?: string
}

export class TemplateEngine {
  static renderInvoice(
    invoice: Invoice,
    client: Client,
    settings: CompanySettings,
    config: TemplateConfig = { style: "modern", showWatermark: false }
  ): ReactElement {
    const isDraft = invoice.status === "draft"
    const showWatermark = config.showWatermark && isDraft

    return (
      <InvoiceTemplate
        invoice={invoice}
        client={client}
        settings={settings}
        template={config.style}
        isDraft={showWatermark}
      />
    )
  }

  static renderQuote(
    quote: Quote,
    client: Client,
    settings: CompanySettings,
    config: TemplateConfig = { style: "modern", showWatermark: false }
  ): ReactElement {
    const isDraft = quote.status === "draft"
    const showWatermark = config.showWatermark && isDraft

    return (
      <QuoteTemplate
        quote={quote}
        client={client}
        settings={settings}
        template={config.style}
        isDraft={showWatermark}
      />
    )
  }

  static getTemplatePreview(style: TemplateStyle, type: DocumentType) {
    const previews = {
      modern: {
        invoice: {
          header: "bg-gradient-to-r from-blue-600 to-blue-800",
          accent: "text-blue-600",
          description: "Modern design with gradient headers and blue accent colors"
        },
        quote: {
          header: "bg-gradient-to-r from-green-600 to-green-800",
          accent: "text-green-600",
          description: "Modern design with gradient headers and green accent colors"
        }
      },
      classic: {
        invoice: {
          header: "bg-gray-900",
          accent: "text-gray-900",
          description: "Classic black and white design with traditional layout"
        },
        quote: {
          header: "bg-gray-900",
          accent: "text-gray-900",
          description: "Classic black and white design with traditional layout"
        }
      },
      minimal: {
        invoice: {
          header: "border-b-2 border-gray-300",
          accent: "text-gray-700",
          description: "Clean, minimal design with subtle borders and muted colors"
        },
        quote: {
          header: "border-b-2 border-gray-300",
          accent: "text-gray-700",
          description: "Clean, minimal design with subtle borders and muted colors"
        }
      }
    }

    return previews[style][type]
  }

  static getDefaultConfig(): TemplateConfig {
    return {
      style: "modern",
      showWatermark: true
    }
  }

  static validateConfig(config: Partial<TemplateConfig>): TemplateConfig {
    const defaultConfig = this.getDefaultConfig()

    return {
      style: config.style || defaultConfig.style,
      showWatermark: config.showWatermark ?? defaultConfig.showWatermark,
      customColors: config.customColors || defaultConfig.customColors,
      customLogo: config.customLogo || defaultConfig.customLogo
    }
  }
}
import React from "react"
import type { Quote, Client, CompanySettings } from "@/lib/invoice-types"
import { QuoteStatus } from "@/lib/invoice-types"
import { cn } from "@/lib/utils"

interface QuoteTemplateProps {
  quote: Quote
  client: Client
  settings: CompanySettings
  template: "modern" | "classic" | "minimal"
  isDraft?: boolean
}

export function QuoteTemplate({ quote, client, settings, template, isDraft = false }: QuoteTemplateProps) {
  const TemplateStyles = {
    modern: {
      header: "bg-gradient-to-r from-green-600 to-green-800 text-white",
      table: "border-gray-200",
      accent: "text-green-600",
      totalBg: "bg-green-50"
    },
    classic: {
      header: "bg-gray-900 text-white",
      table: "border-gray-300",
      accent: "text-gray-900",
      totalBg: "bg-gray-50"
    },
    minimal: {
      header: "border-b-2 border-gray-300",
      table: "border-gray-200",
      accent: "text-gray-700",
      totalBg: "bg-gray-50"
    }
  }

  const styles = TemplateStyles[template]

  const formatCurrency = (amount: number) => {
    return `${settings.currency} ${amount.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className={`bg-white p-8 max-w-4xl mx-auto shadow-sm relative ${isDraft ? 'opacity-75' : ''}`}>
      {/* Draft Watermark */}
      {isDraft && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="transform -rotate-45 text-red-500 text-6xl font-bold opacity-20">
            DRAFT
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">QUOTE</h1>
            <p className="text-xl text-gray-600">#{quote.quoteNumber}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">{settings.companyName}</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{settings.address}</p>
              <p>{settings.email}</p>
              <p>{settings.phone}</p>
            </div>
          </div>
        </div>

        {/* Quote Details */}
        <div className="grid grid-cols-2 gap-8 p-6 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Date Issued</p>
            <p className="text-lg font-semibold">{formatDate(quote.dateIssued)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Valid Until</p>
            <p className="text-lg font-semibold">{formatDate(quote.validUntil)}</p>
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-900">Bill To:</h3>
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-900">{client.company}</p>
            <p className="text-gray-700">{client.name}</p>
            <p className="text-gray-700">{client.email}</p>
            <p className="text-gray-700">{client.phone}</p>
            <p className="text-gray-700">{client.billingAddress}</p>
            {client.vatNumber && (
              <p className="text-gray-700">VAT: {client.vatNumber}</p>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left py-4 px-4 font-bold text-gray-900 border-b-2 border-gray-300">Description</th>
              <th className="text-center py-4 px-4 font-bold text-gray-900 border-b-2 border-gray-300">Qty</th>
              <th className="text-right py-4 px-4 font-bold text-gray-900 border-b-2 border-gray-300">Unit Price</th>
              <th className="text-right py-4 px-4 font-bold text-gray-900 border-b-2 border-gray-300">Total</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-4 px-4">
                  <div>
                    <p className="font-semibold text-gray-900">{item.description}</p>
                    {item.unit && (
                      <p className="text-sm text-gray-500 mt-1">{item.unit}</p>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 text-center font-medium">{item.qty}</td>
                <td className="py-4 px-4 text-right font-medium">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="py-4 px-4 text-right font-semibold text-gray-900">
                  {formatCurrency(item.qty * item.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="mb-8">
        <div className="flex justify-end">
          <div className="w-80">
            <div className="space-y-3">
              <div className="flex justify-between py-2 text-gray-700">
                <span className="font-medium">Subtotal:</span>
                <span>{formatCurrency(quote.subtotalExclVat)}</span>
              </div>
              <div className="flex justify-between py-2 text-gray-700">
                <span className="font-medium">VAT ({settings.vatPercentage}%):</span>
                <span>{formatCurrency(quote.vatAmount)}</span>
              </div>
              <div className="border-t-2 border-gray-300 pt-3">
                <div className="flex justify-between py-2 text-xl font-bold text-gray-900">
                  <span>Total:</span>
                  <span>{formatCurrency(quote.totalInclVat)}</span>
                </div>
              </div>
              {quote.depositPercentage > 0 && (
                <>
                  <div className="flex justify-between py-2 text-gray-600">
                    <span>Deposit ({quote.depositPercentage}%):</span>
                    <span>{formatCurrency(quote.depositAmount)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-semibold text-gray-900">
                    <span>Balance:</span>
                    <span>{formatCurrency(quote.balanceRemaining)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      {settings.termsText && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Terms & Conditions</h3>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{settings.termsText}</p>
          </div>
        </div>
      )}

      {/* Notes */}
      {quote.notes && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Notes</h3>
          <div className="bg-blue-50 p-6 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{quote.notes}</p>
          </div>
        </div>
      )}

      {/* Status Footer */}
      <div className="text-center pt-6 border-t border-gray-300">
        <span className={cn(
          "inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold",
          quote.status === QuoteStatus.Draft && "bg-gray-200 text-gray-900",
          quote.status === QuoteStatus.Sent && "bg-blue-200 text-blue-900",
          quote.status === QuoteStatus.Accepted && "bg-green-200 text-green-900",
          quote.status === QuoteStatus.Declined && "bg-red-200 text-red-900",
          quote.status === QuoteStatus.Expired && "bg-yellow-200 text-yellow-900"
        )}>
          Status: {quote.status.replace("_", " ").toUpperCase()}
        </span>
      </div>
    </div>
  )
}
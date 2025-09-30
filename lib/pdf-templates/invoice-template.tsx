import React from "react"
import type { Invoice, Client, CompanySettings } from "@/lib/invoice-types"
import { InvoiceStatus } from "@/lib/invoice-types"
import { cn } from "@/lib/utils"

interface InvoiceTemplateProps {
  invoice: Invoice
  client: Client
  settings: CompanySettings
  template: "modern" | "classic" | "minimal"
  isDraft?: boolean
}

export function InvoiceTemplate({ invoice, client, settings, template, isDraft = false }: InvoiceTemplateProps) {
  const TemplateStyles = {
    modern: {
      header: "bg-gradient-to-r from-blue-600 to-blue-800 text-white",
      table: "border-gray-200",
      accent: "text-blue-600",
      totalBg: "bg-blue-50"
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">INVOICE</h1>
            <p className="text-xl text-gray-600">#{invoice.invoiceNumber}</p>
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

        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-8 p-6 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Date Issued</p>
            <p className="text-lg font-semibold">{formatDate(invoice.dateIssued)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Due Date</p>
            <p className="text-lg font-semibold">{formatDate(invoice.dueDate)}</p>
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
            {invoice.items.map((item, index) => (
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
                <span>{formatCurrency(invoice.subtotalExclVat)}</span>
              </div>
              <div className="flex justify-between py-2 text-gray-700">
                <span className="font-medium">VAT ({settings.vatPercentage}%):</span>
                <span>{formatCurrency(invoice.vatAmount)}</span>
              </div>
              {invoice.depositRequired && invoice.depositAmount > 0 && (
                <div className="flex justify-between py-2 text-gray-600">
                  <span>Deposit:</span>
                  <span>-{formatCurrency(invoice.depositAmount)}</span>
                </div>
              )}
              <div className="border-t-2 border-gray-300 pt-3">
                <div className="flex justify-between py-2 text-xl font-bold text-gray-900">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.totalInclVat)}</span>
                </div>
              </div>
              {invoice.depositRequired && invoice.depositAmount > 0 && (
                <div className="flex justify-between py-2 font-semibold text-gray-900">
                  <span>Balance:</span>
                  <span>{formatCurrency(invoice.balanceRemaining)}</span>
                </div>
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

      {/* Payment Instructions */}
      {settings.paymentInstructions && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Payment Instructions</h3>
          <div className="bg-blue-50 p-6 rounded-lg space-y-2">
            {settings.paymentInstructions.bank && (
              <p className="text-gray-700"><strong>Bank:</strong> {settings.paymentInstructions.bank}</p>
            )}
            {settings.paymentInstructions.accountName && (
              <p className="text-gray-700"><strong>Account Name:</strong> {settings.paymentInstructions.accountName}</p>
            )}
            {settings.paymentInstructions.accountNumber && (
              <p className="text-gray-700"><strong>Account Number:</strong> {settings.paymentInstructions.accountNumber}</p>
            )}
            {settings.paymentInstructions.branchCode && (
              <p className="text-gray-700"><strong>Branch Code:</strong> {settings.paymentInstructions.branchCode}</p>
            )}
          </div>
        </div>
      )}

      {/* Status Footer */}
      <div className="text-center pt-6 border-t border-gray-300">
        <span className={cn(
          "inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold",
          invoice.status === InvoiceStatus.Draft && "bg-gray-200 text-gray-900",
          invoice.status === InvoiceStatus.Sent && "bg-blue-200 text-blue-900",
          invoice.status === InvoiceStatus.PartiallyPaid && "bg-yellow-200 text-yellow-900",
          invoice.status === InvoiceStatus.Paid && "bg-green-200 text-green-900",
          invoice.status === InvoiceStatus.Overdue && "bg-red-200 text-red-900"
        )}>
          Status: {invoice.status.replace("_", " ").toUpperCase()}
        </span>
      </div>
    </div>
  )
}
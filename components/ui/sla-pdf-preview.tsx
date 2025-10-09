"use client"

import React, { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Download,
  Loader2,
  FileText,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { cn } from "@/lib/utils"
import { SLATemplate } from "@/lib/pdf-templates/sla-template"
import { ServiceAgreement, Client, CompanySettings } from "@/lib/invoice-types"
import { SLAStatus } from "@/lib/sla-types"

interface SLAPDFPreviewProps {
  serviceAgreement: ServiceAgreement
  client: Client
  settings: CompanySettings
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

function SLAPDFContent({
  serviceAgreement,
  client,
  settings
}: {
  serviceAgreement: ServiceAgreement
  client: Client
  settings: CompanySettings
}) {
  const isDraft = serviceAgreement.status === 'draft'
  const isGenerated = serviceAgreement.status === 'generated'
  const isSent = serviceAgreement.status === 'sent'
  const isAccepted = serviceAgreement.status === 'accepted'
  const isRejected = serviceAgreement.status === 'rejected'

  // Extract variables from service agreement
  const variables = {
    // Client Information
    client_name: client.name,
    client_company: client.company,
    client_email: client.email,
    client_address: client.billingAddress,

    // Service Provider Information
    provider_company: settings.companyName,
    provider_email: settings.email,

    // Service Details
    service_description: serviceAgreement.agreement_content?.service_description as string || 'Custom software development services',
    project_scope: serviceAgreement.agreement_content?.project_scope as string || 'Development project as per specifications',

    // Financial Terms
    total_contract_value: serviceAgreement.agreement_variables?.total_contract_value as number || 0,
    deposit_percentage: serviceAgreement.agreement_variables?.deposit_percentage as number || 40,
    deposit_amount: serviceAgreement.agreement_variables?.deposit_amount as number || 0,
    balance_percentage: serviceAgreement.agreement_variables?.balance_percentage as number || 60,
    balance_amount: serviceAgreement.agreement_variables?.balance_amount as number || 0,

    // Performance Metrics
    uptime_guarantee: serviceAgreement.uptime_guarantee || 99.5,
    response_time_hours: serviceAgreement.response_time_hours || 24,
    resolution_time_hours: serviceAgreement.resolution_time_hours || 72,

    // Timeline
    project_start_date: serviceAgreement.agreement_variables?.project_start_date as string || new Date().toISOString().split('T')[0],
    warranty_months: serviceAgreement.agreement_variables?.warranty_months as number || 3,

    // Legal Terms
    governing_law: serviceAgreement.agreement_variables?.governing_law as string || 'South African Law',
    jurisdiction: serviceAgreement.agreement_variables?.jurisdiction as string || 'South Africa',

    // Additional variables from agreement content
    effectiveDate: serviceAgreement.agreement_variables?.effective_date as string || new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/'),
    serviceProvider: settings.companyName,
    timelineDays: serviceAgreement.agreement_variables?.project_timeline_days as number || 3,
    supportMonths: serviceAgreement.agreement_variables?.warranty_months as number || 3,
    serviceProviderName: 'Mcmarsh Dzwimbu',
    serviceProviderTitle: 'Chief Operating Officer'
  }

  return (
    <div
      id="sla-pdf-content"
      className={`bg-white dark:bg-gray-900 p-8 max-w-4xl mx-auto shadow-sm relative ${
        isDraft ? 'opacity-75' : ''
      }`}
    >
      {/* Status Watermarks */}
      {isDraft && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="transform -rotate-45 text-red-500 text-6xl font-bold opacity-20">
            DRAFT
          </div>
        </div>
      )}

      {isRejected && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="transform -rotate-45 text-red-600 text-6xl font-bold opacity-20">
            REJECTED
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Service Level Agreement</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">#{serviceAgreement.agreement_number}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{settings.companyName}</h2>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>{settings.address}</p>
              <p>{settings.email}</p>
              <p>{settings.phone}</p>
            </div>
          </div>
        </div>

        {/* SLA Details */}
        <div className="grid grid-cols-2 gap-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Effective Date</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {new Date(variables.effectiveDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</p>
            <div className="flex items-center gap-2">
              <span className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold",
                serviceAgreement.status === 'draft' && "bg-gray-200 text-gray-900",
                serviceAgreement.status === 'generated' && "bg-blue-200 text-blue-900",
                serviceAgreement.status === 'sent' && "bg-yellow-200 text-yellow-900",
                serviceAgreement.status === 'accepted' && "bg-green-200 text-green-900",
                serviceAgreement.status === 'rejected' && "bg-red-200 text-red-900"
              )}>
                {serviceAgreement.status.replace('_', ' ').toUpperCase()}
              </span>
              {serviceAgreement.auto_generated && (
                <AlertCircle className="h-4 w-4 text-blue-500" title="Auto-generated" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SLA Template Content */}
      <div className="mb-8">
        <SLATemplate variables={variables} />
      </div>

      {/* Performance Metrics Summary */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Performance Summary</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-800 dark:text-green-200">
              {variables.uptime_guarantee}%
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">Uptime Guarantee</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
              {variables.response_time_hours}h
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400">Response Time</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
              {variables.resolution_time_hours}h
            </p>
            <p className="text-sm text-purple-600 dark:text-purple-400">Resolution Time</p>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Financial Terms</h3>
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <div className="space-y-3">
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span className="font-medium">Total Contract Value:</span>
              <span className="font-semibold">{settings.currency} {variables.total_contract_value.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span className="font-medium">Deposit ({variables.deposit_percentage}%):</span>
              <span>{settings.currency} {variables.deposit_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span className="font-medium">Balance ({variables.balance_percentage}%):</span>
              <span>{settings.currency} {variables.balance_amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Footer */}
      <div className="text-center pt-6 border-t border-gray-300 dark:border-gray-700">
        <div className="flex items-center justify-center gap-4">
          <span className={cn(
            "inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold",
            serviceAgreement.status === 'draft' && "bg-gray-200 text-gray-900",
            serviceAgreement.status === 'generated' && "bg-blue-200 text-blue-900",
            serviceAgreement.status === 'sent' && "bg-yellow-200 text-yellow-900",
            serviceAgreement.status === 'accepted' && "bg-green-200 text-green-900",
            serviceAgreement.status === 'rejected' && "bg-red-200 text-red-900"
          )}>
            {serviceAgreement.status === 'accepted' && <CheckCircle className="h-4 w-4 mr-2" />}
            Status: {serviceAgreement.status.replace('_', ' ').toUpperCase()}
          </span>

          {serviceAgreement.auto_generated && (
            <div className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
              <AlertCircle className="h-4 w-4" />
              <span>Auto-generated</span>
            </div>
          )}
        </div>

        {serviceAgreement.generated_at && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Generated on {new Date(serviceAgreement.generated_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        )}
      </div>
    </div>
  )
}

export function SLAPDFPreview({
  serviceAgreement,
  client,
  settings,
  isOpen,
  onOpenChange
}: SLAPDFPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const generateAndDownloadPDF = useCallback(async () => {
    if (!contentRef.current) {
      console.error("PDF content reference not found")
      return
    }

    setIsGenerating(true)
    try {
      // Wait for content to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 500))

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        allowTaint: false,
        width: contentRef.current.scrollWidth,
        height: contentRef.current.scrollHeight
      })

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error("Canvas has zero dimensions")
      }

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
      link.download = `sla-${serviceAgreement.agreement_number}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error generating PDF:", error)
      // You could add a toast notification here
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }, [serviceAgreement.agreement_number])

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 flex flex-col bg-white dark:bg-gray-900">
        <DialogHeader className="p-6 pb-0 flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <FileText className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              SLA Preview - {serviceAgreement.agreement_number}
            </DialogTitle>
            <Button
              size="sm"
              onClick={generateAndDownloadPDF}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
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

        <div className="flex-1 p-6 overflow-hidden bg-gray-50 dark:bg-gray-800">
          <ScrollArea className="h-full w-full">
            <div className="flex justify-center p-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg min-w-full">
                <SLAPDFContent
                  serviceAgreement={serviceAgreement}
                  client={client}
                  settings={settings}
                />
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
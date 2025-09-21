"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

import type { Invoice, Client, CompanySettings } from "@/lib/invoice-types"
import { fetchClients, fetchCompanySettings, formatCurrency } from "@/lib/mappers"
import { supabase } from "@/lib/supabase"
import { InvoiceStatus } from "@/lib/invoice-types"

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  dateIssued: z.string().min(1, "Date issued is required"),
  dueDate: z.string().min(1, "Due date is required"),
  status: z.nativeEnum(InvoiceStatus),
  depositRequired: z.boolean(),
  depositAmount: z.number().min(0),
})

type InvoiceFormValues = z.infer<typeof invoiceSchema>

interface InvoiceEditorProps {
  invoice?: Invoice | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (invoice: Invoice) => void
}

export function InvoiceEditor({ invoice, open, onOpenChange, onSaved }: InvoiceEditorProps) {
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [settings, setSettings] = useState<CompanySettings | null>(null)

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientId: invoice?.clientId || "",
      dateIssued: invoice?.dateIssued ? new Date(invoice.dateIssued).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : "",
      status: invoice?.status || InvoiceStatus.Draft,
      depositRequired: invoice?.depositRequired || false,
      depositAmount: invoice?.depositAmount || 0,
    },
  })

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  useEffect(() => {
    if (invoice) {
      form.reset({
        clientId: invoice.clientId,
        dateIssued: new Date(invoice.dateIssued).toISOString().split('T')[0],
        dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
        status: invoice.status,
        depositRequired: invoice.depositRequired,
        depositAmount: invoice.depositAmount,
      })
    } else {
      form.reset({
        clientId: "",
        dateIssued: new Date().toISOString().split('T')[0],
        dueDate: "",
        status: InvoiceStatus.Draft,
        depositRequired: false,
        depositAmount: 0,
      })
    }
  }, [invoice, form])

  const loadData = async () => {
    try {
      const [clientsData, settingsData] = await Promise.all([
        fetchClients(),
        fetchCompanySettings(),
      ])
      setClients(clientsData)
      setSettings(settingsData)
    } catch (error) {
      console.error("Failed to load data:", error)
      toast.error("Failed to load data")
    }
  }

  const handleSubmit = async (values: InvoiceFormValues) => {
    if (!invoice) {
      toast.error("Invoice editing is not implemented yet")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from("invoices")
        .update({
          client_id: values.clientId,
          date_issued: values.dateIssued,
          due_date: values.dueDate,
          status: values.status,
          deposit_required: values.depositRequired,
          deposit_amount: values.depositAmount,
        })
        .eq("id", invoice.id)

      if (error) throw error

      const updatedInvoice: Invoice = {
        ...invoice,
        ...values,
      }

      onSaved(updatedInvoice)
      toast.success("Invoice updated successfully")
      onOpenChange(false)
    } catch (error: unknown) {
      console.error("Failed to save invoice:", error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Failed to save invoice: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
          <DialogDescription>
            Update invoice details and status
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.company}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="partially_paid">Partially Paid</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateIssued"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date Issued</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Items (Read-only) */}
            {invoice && (
              <Card>
                <CardHeader>
                  <CardTitle>Items</CardTitle>
                  <CardDescription>Invoice items (read-only)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {invoice.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.qty} × {formatCurrency(item.unitPrice, settings?.currency)} = {formatCurrency(item.qty * item.unitPrice, settings?.currency)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(item.qty * item.unitPrice, settings?.currency)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Totals */}
            {invoice && (
              <Card>
                <CardHeader>
                  <CardTitle>Totals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatCurrency(invoice.subtotalExclVat, settings?.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT ({settings?.vatPercentage}%)</span>
                      <span>{formatCurrency(invoice.vatAmount, settings?.currency)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(invoice.totalInclVat, settings?.currency)}</span>
                    </div>
                    {invoice.depositRequired && (
                      <>
                        <div className="flex justify-between">
                          <span>Deposit Amount</span>
                          <span>{formatCurrency(invoice.depositAmount, settings?.currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Balance Remaining</span>
                          <span>{formatCurrency(invoice.balanceRemaining, settings?.currency)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Invoice"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
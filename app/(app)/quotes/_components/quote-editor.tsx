"use client"

import * as React from "react"
import { useEffect, useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Eye, Save, Package, Calculator, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"

import type { Quote, Client, CompanySettings, Item, Package as PackageType } from "@/lib/invoice-types"
import { QuoteStatus, ItemType } from "@/lib/invoice-types"
import { fetchClients, fetchCompanySettings, formatCurrency, fetchPackages } from "@/lib/mappers"
import { supabase } from "@/lib/supabase"


const quoteSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  dateIssued: z.string().min(1, "Date issued is required"),
  validUntil: z.string().min(1, "Valid until date is required"),
  status: z.nativeEnum(QuoteStatus),
  depositPercentage: z.number().min(0, "Deposit must be 0% or higher").max(100, "Deposit cannot exceed 100%"),
  notes: z.string().max(2000, "Notes too long").optional(),
  termsText: z.string().max(5000, "Terms text too long").optional(),
}).refine((data) => {
  const issuedDate = new Date(data.dateIssued)
  const validUntilDate = new Date(data.validUntil)
  return validUntilDate > issuedDate
}, {
  message: "Valid until date must be after the date issued",
  path: ["validUntil"],
})

type QuoteFormValues = z.infer<typeof quoteSchema>

interface QuoteEditorProps {
  quote?: Quote | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (quote: Quote) => void
}

export function QuoteEditor({ quote, open, onOpenChange, onSaved }: QuoteEditorProps) {
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [packages, setPackages] = useState<PackageType[]>([])
  const [items, setItems] = useState<Item[]>(quote?.items || [])
  const [selectedPackage, setSelectedPackage] = useState<string>("")
  const [isCalculating, setIsCalculating] = useState(false)

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      clientId: quote?.clientId || "",
      dateIssued: quote?.dateIssued ? new Date(quote.dateIssued).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      validUntil: quote?.validUntil ? new Date(quote.validUntil).toISOString().split('T')[0] : "",
      status: quote?.status || QuoteStatus.Draft,
      depositPercentage: quote?.depositPercentage || 40,
      notes: quote?.notes || "",
      termsText: quote?.termsText || "",
    },
  })

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  useEffect(() => {
    if (quote) {
      form.reset({
        clientId: quote.clientId,
        dateIssued: new Date(quote.dateIssued).toISOString().split('T')[0],
        validUntil: new Date(quote.validUntil).toISOString().split('T')[0],
        status: quote.status,
        depositPercentage: quote.depositPercentage,
        notes: quote.notes,
        termsText: quote.termsText,
      })
      setItems(quote.items)
    } else {
      form.reset({
        clientId: "",
        dateIssued: new Date().toISOString().split('T')[0],
        validUntil: "",
        status: QuoteStatus.Draft,
        depositPercentage: 40,
        notes: "",
        termsText: "",
      })
      setItems([])
    }
  }, [quote, form])

  const loadData = useCallback(async () => {
    try {
      const [clientsData, settingsData, packagesData] = await Promise.all([
        fetchClients(),
        fetchCompanySettings(),
        fetchPackages(),
      ])
      setClients(clientsData)
      setSettings(settingsData)
      setPackages(packagesData)
    } catch (error) {
      console.error("Failed to load data:", error)
      toast.error("Failed to load data")
    }
  }, [])

  const calculateTotals = useCallback((currentItems: Item[]) => {
    console.log('calculateTotals called with items:', currentItems.length)
    const subtotalExclVat = currentItems.reduce((acc, item) => acc + item.unitPrice * item.qty, 0)
    const taxableAmount = currentItems.filter(i => i.taxable).reduce((acc, item) => acc + item.unitPrice * item.qty, 0)
    const vatPercentage = settings?.vatPercentage || 0
    const vatAmount = taxableAmount * (vatPercentage / 100)
    const totalInclVat = subtotalExclVat + vatAmount
    const depositPercentage = form.watch("depositPercentage")
    const depositAmount = totalInclVat * (depositPercentage / 100)
    const balanceRemaining = totalInclVat - depositAmount

    console.log('calculateTotals result:', {
      subtotalExclVat,
      vatAmount,
      totalInclVat,
      depositAmount,
      balanceRemaining
    })

    return {
      subtotalExclVat,
      vatAmount,
      totalInclVat,
      depositAmount,
      balanceRemaining,
    }
  }, [settings?.vatPercentage, form.watch]);

  const totals = React.useMemo(() => calculateTotals(items), [items, calculateTotals]);


  // Effect to manage the `isCalculating` state based on changes in items or form values
  useEffect(() => {
    let isMounted = true; // Flag to track if the component is mounted
    setIsCalculating(true);
    const timer = setTimeout(() => {
      if (isMounted) { // Only update state if the component is still mounted
        setIsCalculating(false);
      }
    }, 50); // Small delay to show calculation state

    return () => {
      isMounted = false; // Set flag to false when component unmounts
      clearTimeout(timer);
    };
  }, [items, form.watch("depositPercentage")]);

  const addItem = useCallback(() => {
    const newItem: Item = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description: "",
      unitPrice: 0,
      qty: 1,
      taxable: true,
      itemType: ItemType.Fixed,
      unit: "each",
    }
    setItems(prev => [...prev, newItem])
  }, [])

  const updateItem = useCallback((index: number, field: keyof Item, value: Item[keyof Item]) => {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ))
  }, [])

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handlePackageSelect = useCallback((packageId: string) => {
    const selectedPkg = packages.find(p => p.id === packageId)
    if (selectedPkg) {
      const packageItems: Item[] = selectedPkg.items.map((item, index) => ({
        ...item,
        id: `pkg-item-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      }))
      setItems(prev => [...prev, ...packageItems])
      toast.success(`Added ${selectedPkg.items.length} items from ${selectedPkg.name}`)
    }
    setSelectedPackage("")
  }, [packages])

  const handleSubmit = async (values: QuoteFormValues) => {
    if (items.length === 0) {
      toast.error("Please add at least one item")
      return
    }

    setLoading(true)
    try {
      const quoteData = {
        ...values,
        items,
        ...totals,
        createdByUserId: "user1", // Hardcoded for demo
      }

      if (quote) {
        // Update existing quote
        const { error } = await supabase
          .from("quotes")
          .update({
            client_id: values.clientId,
            date_issued: values.dateIssued,
            valid_until: values.validUntil,
            status: values.status,
            deposit_percentage: values.depositPercentage,
            notes: values.notes,
            terms_text: values.termsText,
            subtotal_excl_vat: totals.subtotalExclVat,
            vat_amount: totals.vatAmount,
            total_incl_vat: totals.totalInclVat,
            deposit_amount: totals.depositAmount,
            balance_remaining: totals.balanceRemaining,
          })
          .eq("id", quote.id)

        if (error) throw error

        const updatedQuote: Quote = {
          ...quote,
          ...values,
          items,
          ...totals,
        }

        onSaved(updatedQuote)
        toast.success("Quote updated successfully")
      } else {
        // Create new quote
        const nextQuoteNumber = settings ? `${settings.numberingFormatQuote.replace('{seq:04d}', settings.nextQuoteNumber.toString().padStart(4, '0'))}` : `Q-${Date.now()}`

        const { data, error } = await supabase
          .from("quotes")
          .insert({
            quote_number: nextQuoteNumber,
            created_by_user_id: "user1",
            client_id: values.clientId,
            date_issued: values.dateIssued,
            valid_until: values.validUntil,
            status: values.status,
            deposit_percentage: values.depositPercentage,
            notes: values.notes,
            terms_text: values.termsText,
            subtotal_excl_vat: totals.subtotalExclVat,
            vat_amount: totals.vatAmount,
            total_incl_vat: totals.totalInclVat,
            deposit_amount: totals.depositAmount,
            balance_remaining: totals.balanceRemaining,
          })
          .select()
          .single()

        if (error) throw error

        // First insert the items into the items table
        const itemInserts = items.map(item => ({
          description: item.description,
          unit_price: item.unitPrice,
          qty: item.qty,
          taxable: item.taxable,
          item_type: item.itemType,
          unit: item.unit,
        }))

        const { data: insertedItems, error: itemsError } = await supabase
          .from("items")
          .insert(itemInserts)
          .select()

        if (itemsError) throw itemsError

        // Then create the junction records in quote_items
        const quoteItemInserts = insertedItems.map(item => ({
          quote_id: data.id,
          item_id: item.id,
        }))

        const { error: quoteItemsError } = await supabase
          .from("quote_items")
          .insert(quoteItemInserts)

        if (quoteItemsError) throw quoteItemsError

        if (itemsError) throw itemsError

        const newQuote: Quote = {
          id: data.id,
          quoteNumber: data.quote_number,
          createdByUserId: data.created_by_user_id,
          dateIssued: data.date_issued,
          validUntil: data.valid_until,
          clientId: data.client_id,
          items,
          ...totals,
          depositPercentage: values.depositPercentage,
          status: data.status,
          termsText: data.terms_text,
          notes: data.notes,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        }

        onSaved(newQuote)
        toast.success("Quote created successfully")
      }

      onOpenChange(false)
    } catch (error: unknown) {
      console.error("Failed to save quote:", error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Failed to save quote: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0 gap-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col h-full"
        >
          <DialogHeader className="px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                {quote ? "Edit Quote" : "Create New Quote"}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {quote ? "Update quote details and manage items" : "Build a professional quote with items, packages, and pricing"}
              </DialogDescription>
            </motion.div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="p-6 space-y-6">
                {/* Quote Details */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Quote Details
                      </CardTitle>
                      <CardDescription>
                        Configure the basic quote information and settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField
                          control={form.control}
                          name="clientId"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel className="text-sm font-medium">Client *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="focus:ring-2 focus:ring-primary/20" aria-describedby="client-error">
                                    <SelectValue placeholder="Select a client" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <AnimatePresence>
                                    {clients.map((client) => (
                                      <motion.div
                                        key={client.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                      >
                                        <SelectItem value={client.id}>
                                          <div className="flex flex-col">
                                            <span className="font-medium">{client.company}</span>
                                            <span className="text-xs text-muted-foreground">{client.name}</span>
                                          </div>
                                        </SelectItem>
                                      </motion.div>
                                    ))}
                                  </AnimatePresence>
                                </SelectContent>
                              </Select>
                              <FormMessage id="client-error" role="alert" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Status</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="focus:ring-2 focus:ring-primary/20">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="draft">
                                    <Badge variant="secondary" className="mr-2">Draft</Badge>
                                  </SelectItem>
                                  <SelectItem value="sent">
                                    <Badge variant="default" className="mr-2">Sent</Badge>
                                  </SelectItem>
                                  <SelectItem value="accepted">
                                    <Badge variant="default" className="mr-2 bg-green-500">Accepted</Badge>
                                  </SelectItem>
                                  <SelectItem value="declined">
                                    <Badge variant="destructive" className="mr-2">Declined</Badge>
                                  </SelectItem>
                                  <SelectItem value="expired">
                                    <Badge variant="outline" className="mr-2">Expired</Badge>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="depositPercentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Deposit %</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    className="pr-8 focus:ring-2 focus:ring-primary/20"
                                    min="0"
                                    max="100"
                                    aria-describedby="deposit-help"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                                </div>
                              </FormControl>
                              <p id="deposit-help" className="text-xs text-muted-foreground">Required deposit percentage</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="dateIssued"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Date Issued *</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  className="focus:ring-2 focus:ring-primary/20"
                                  aria-describedby="date-issued-error"
                                />
                              </FormControl>
                              <FormMessage id="date-issued-error" role="alert" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="validUntil"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Valid Until *</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  className="focus:ring-2 focus:ring-primary/20"
                                  aria-describedby="valid-until-error"
                                />
                              </FormControl>
                              <FormMessage id="valid-until-error" role="alert" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Items Management */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="shadow-sm">
                    <CardHeader className="pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Items & Services
                          </CardTitle>
                          <CardDescription>
                            Add individual items or select from predefined packages
                          </CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          {packages.length > 0 && (
                            <Select value={selectedPackage} onValueChange={handlePackageSelect}>
                              <SelectTrigger className="w-full sm:w-48 focus:ring-2 focus:ring-primary/20">
                                <SelectValue placeholder="Add from package" />
                              </SelectTrigger>
                              <SelectContent>
                                <AnimatePresence>
                                  {packages.map((pkg) => (
                                    <motion.div
                                      key={pkg.id}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: 10 }}
                                    >
                                      <SelectItem value={pkg.id}>
                                        <div className="flex flex-col">
                                          <span className="font-medium">{pkg.name}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {pkg.items.length} items • {formatCurrency(pkg.priceInclVat, settings?.currency)}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    </motion.div>
                                  ))}
                                </AnimatePresence>
                              </SelectContent>
                            </Select>
                          )}
                          <Button
                            type="button"
                            onClick={addItem}
                            size="sm"
                            className="focus:ring-2 focus:ring-primary/20"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {items.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg"
                        >
                          <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                          <h3 className="text-lg font-medium text-muted-foreground mb-2">No items added yet</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Add individual items or select from packages to get started
                          </p>
                          <Button type="button" onClick={addItem} variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Item
                          </Button>
                        </motion.div>
                      ) : (
                        <div className="rounded-md border overflow-hidden">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/50">
                                  <TableHead className="min-w-[200px]">Description</TableHead>
                                  <TableHead className="min-w-[80px]">Unit</TableHead>
                                  <TableHead className="min-w-[80px]">Qty</TableHead>
                                  <TableHead className="min-w-[100px]">Unit Price</TableHead>
                                  <TableHead className="min-w-[100px]">Total</TableHead>
                                  <TableHead className="min-w-[80px]">Taxable</TableHead>
                                  <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <AnimatePresence>
                                  {items.map((item, index) => (
                                    <motion.tr
                                      key={item.id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      transition={{ duration: 0.2 }}
                                      className="group hover:bg-muted/50"
                                    >
                                      <TableCell>
                                        <Input
                                          value={item.description}
                                          onChange={(e) => updateItem(index, "description", e.target.value)}
                                          placeholder="Item description"
                                          className="border-0 focus:ring-2 focus:ring-primary/20 bg-transparent"
                                          aria-label={`Description for item ${index + 1}`}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          value={item.unit}
                                          onChange={(e) => updateItem(index, "unit", e.target.value)}
                                          placeholder="each"
                                          className="w-16 border-0 focus:ring-2 focus:ring-primary/20 bg-transparent"
                                          aria-label={`Unit for item ${index + 1}`}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          value={item.qty}
                                          onChange={(e) => updateItem(index, "qty", parseFloat(e.target.value) || 0)}
                                          className="w-16 border-0 focus:ring-2 focus:ring-primary/20 bg-transparent"
                                          min="0.01"
                                          step="0.01"
                                          aria-label={`Quantity for item ${index + 1}`}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={item.unitPrice}
                                          onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                                          className="w-24 border-0 focus:ring-2 focus:ring-primary/20 bg-transparent"
                                          min="0"
                                          aria-label={`Unit price for item ${index + 1}`}
                                        />
                                      </TableCell>
                                      <TableCell className="font-medium">
                                        <motion.span
                                          key={item.unitPrice * item.qty}
                                          initial={{ scale: 1.1, color: "#22c55e" }}
                                          animate={{ scale: 1, color: "inherit" }}
                                          transition={{ duration: 0.2 }}
                                        >
                                          {formatCurrency(item.unitPrice * item.qty, settings?.currency)}
                                        </motion.span>
                                      </TableCell>
                                      <TableCell>
                                        <Checkbox
                                          checked={item.taxable}
                                          onCheckedChange={(checked) => updateItem(index, "taxable", !!checked)}
                                          aria-label={`Taxable for item ${index + 1}`}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeItem(index)}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                          aria-label={`Remove item ${index + 1}`}
                                        >
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </TableCell>
                                    </motion.tr>
                                  ))}
                                </AnimatePresence>
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Financial Summary */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="shadow-sm border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Financial Summary
                      </CardTitle>
                      <CardDescription>
                        Automatic calculations with VAT and deposit requirements
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {isCalculating && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            Calculating...
                          </motion.div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <motion.div
                              className="flex justify-between items-center py-2"
                              key={`subtotal-${totals.subtotalExclVat}`}
                              initial={{ scale: 1.02 }}
                              animate={{ scale: 1 }}
                            >
                              <span className="text-sm font-medium">Subtotal (Excl. VAT)</span>
                              <span className="font-mono text-sm">
                                {formatCurrency(totals.subtotalExclVat, settings?.currency)}
                              </span>
                            </motion.div>

                            <motion.div
                              className="flex justify-between items-center py-2"
                              key={`vat-${totals.vatAmount}`}
                              initial={{ scale: 1.02 }}
                              animate={{ scale: 1 }}
                            >
                              <span className="text-sm font-medium">
                                VAT ({settings?.vatPercentage}%)
                              </span>
                              <span className="font-mono text-sm">
                                {formatCurrency(totals.vatAmount, settings?.currency)}
                              </span>
                            </motion.div>

                            <Separator />

                            <motion.div
                              className="flex justify-between items-center py-3"
                              key={`total-${totals.totalInclVat}`}
                              initial={{ scale: 1.05, color: "#22c55e" }}
                              animate={{ scale: 1, color: "inherit" }}
                              transition={{ duration: 0.3 }}
                            >
                              <span className="text-lg font-bold">Total (Incl. VAT)</span>
                              <span className="font-mono text-lg font-bold text-primary">
                                {formatCurrency(totals.totalInclVat, settings?.currency)}
                              </span>
                            </motion.div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between py-2">
                              <span className="text-sm font-medium">Deposit Required</span>
                              <FormField
                                control={form.control}
                                name="depositPercentage"
                                render={({ field }) => (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                      className="w-16 h-8 text-sm focus:ring-2 focus:ring-primary/20"
                                      min="0"
                                      max="100"
                                    />
                                    <span className="text-sm">%</span>
                                  </div>
                                )}
                              />
                            </div>

                            <motion.div
                              className="flex justify-between items-center py-2"
                              key={`deposit-${totals.depositAmount}`}
                              initial={{ scale: 1.02 }}
                              animate={{ scale: 1 }}
                            >
                              <span className="text-sm font-medium">Deposit Amount</span>
                              <span className="font-mono text-sm">
                                {formatCurrency(totals.depositAmount, settings?.currency)}
                              </span>
                            </motion.div>

                            <motion.div
                              className="flex justify-between items-center py-2"
                              key={`balance-${totals.balanceRemaining}`}
                              initial={{ scale: 1.02 }}
                              animate={{ scale: 1 }}
                            >
                              <span className="text-sm font-medium">Balance Remaining</span>
                              <span className="font-mono text-sm">
                                {formatCurrency(totals.balanceRemaining, settings?.currency)}
                              </span>
                            </motion.div>
                          </div>
                        </div>

                        {items.length === 0 && (
                          <div className="mt-4 p-4 border border-amber-200 bg-amber-50 rounded-lg flex items-center gap-3">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <p className="text-sm text-amber-800">
                              Add items to see financial calculations and totals.
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Additional Information */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Additional Information
                      </CardTitle>
                      <CardDescription>
                        Optional notes and terms that will appear on the quote
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Internal Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Internal notes (not visible to client)..."
                                className="min-h-[80px] focus:ring-2 focus:ring-primary/20 resize-none"
                                aria-describedby="notes-help"
                              />
                            </FormControl>
                            <p id="notes-help" className="text-xs text-muted-foreground">
                              These notes are for internal use only and won&apos;t appear on the quote
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="termsText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Terms & Conditions</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Terms and conditions that will appear on the quote..."
                                className="min-h-[100px] focus:ring-2 focus:ring-primary/20 resize-none"
                                aria-describedby="terms-help"
                              />
                            </FormControl>
                            <p id="terms-help" className="text-xs text-muted-foreground">
                              These terms will be visible to the client on the quote
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-6 -mb-6 px-6 pb-6"
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1 sm:flex-none focus:ring-2 focus:ring-primary/20"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || items.length === 0}
                    className="flex-1 sm:flex-none focus:ring-2 focus:ring-primary/20"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {quote ? "Update Quote" : "Create Quote"}
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>
            </Form>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
"use client"

import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Plus, Search, Trash2, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

import type { Client } from "@/lib/invoice-types"
import { fetchClients } from "@/lib/mappers"
import { supabase } from "@/lib/supabase"

const clientSchema = z.object({
  name: z.string().trim().min(1, "Contact name is required"),
  company: z.string().trim().min(1, "Company name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().optional().default(""),
  billingAddress: z.string().trim().optional().default(""),
  deliveryAddress: z.string().trim().optional().default(""),
  vatNumber: z.string().trim().optional().default(""),
})
type ClientFormValues = z.input<typeof clientSchema>

export default function ClientsPage() {
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const data = await fetchClients()
        if (!mounted) return
        setClients(data)
      } catch (e) {
        console.error(e)
        toast.error("Failed to load clients")
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return clients.filter((c) => {
      const text = `${c.company} ${c.name} ${c.email} ${c.phone}`.toLowerCase()
      return text.includes(q)
    })
  }, [clients, query])

  function startCreate() {
    setEditing(null)
    setOpen(true)
  }

  function startEdit(client: Client) {
    setEditing(client)
    setOpen(true)
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from("clients").delete().eq("id", id)
      if (error) throw error
      setClients((prev) => prev.filter((c) => c.id !== id))
      toast.success("Client deleted")
    } catch (e: unknown) {
      console.error(e)
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      toast.error(`Failed to delete client: ${errorMessage}`)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Clients</CardTitle>
          <CardDescription>Manage your customers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                aria-label="Search clients"
                placeholder="Search by company, contact, email, or phone"
                className="pl-8"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="grow" />

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={startCreate}>
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                  New Client
                </Button>
              </DialogTrigger>
              <ClientDialog
                open={open}
                onOpenChange={setOpen}
                client={editing}
                onSaved={(c, mode) => {
                  if (mode === "create") setClients((prev) => [c, ...prev])
                  else setClients((prev) => prev.map((p) => (p.id === c.id ? c : p)))
                }}
              />
            </Dialog>
          </div>

          <Separator />

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                      No clients found.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.company}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell className="truncate">{c.email}</TableCell>
                      <TableCell>{c.phone || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => startEdit(c)} aria-label="Edit client">
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(c.id)}
                            aria-label="Delete client"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ClientDialog({
  open,
  onOpenChange,
  client,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  client: Client | null
  onSaved: (client: Client, mode: "create" | "update") => void
}) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      billingAddress: "",
      deliveryAddress: "",
      vatNumber: "",
    },
    mode: "onTouched",
  })

  useEffect(() => {
    if (client) {
      form.reset({
        name: client.name ?? "",
        company: client.company ?? "",
        email: client.email ?? "",
        phone: client.phone ?? "",
        billingAddress: client.billingAddress ?? "",
        deliveryAddress: client.deliveryAddress ?? "",
        vatNumber: client.vatNumber ?? "",
      })
    } else {
      form.reset({
        name: "",
        company: "",
        email: "",
        phone: "",
        billingAddress: "",
        deliveryAddress: "",
        vatNumber: "",
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, open])

  const isSubmitting = form.formState.isSubmitting

  async function onSubmit(values: ClientFormValues) {
    try {
      if (!client) {
        // create
        const toInsert = {
          name: values.name,
          company: values.company,
          email: values.email,
          billing_address: values.billingAddress,
          delivery_address: values.deliveryAddress,
          vat_number: values.vatNumber,
          phone: values.phone ?? "",
        }
        const { data, error } = await supabase.from("clients").insert(toInsert).select().single()
        if (error) throw error
        const created: Client = {
          id: data.id,
          name: data.name ?? "",
          company: data.company ?? "",
          email: data.email ?? "",
          billingAddress: data.billing_address ?? "",
          deliveryAddress: data.delivery_address ?? "",
          vatNumber: data.vat_number ?? "",
          phone: data.phone ?? "",
          createdAt: data.created_at ?? new Date().toISOString(),
          updatedAt: data.updated_at ?? new Date().toISOString(),
        }
        toast.success("Client created")
        onSaved(created, "create")
        onOpenChange(false)
      } else {
        // update
        const toUpdate = {
          name: values.name,
          company: values.company,
          email: values.email,
          billing_address: values.billingAddress,
          delivery_address: values.deliveryAddress,
          vat_number: values.vatNumber,
          phone: values.phone ?? "",
        }
        const { error } = await supabase.from("clients").update(toUpdate).eq("id", client.id)
        if (error) throw error
        const updated: Client = {
          ...client,
          ...{
            name: values.name,
            company: values.company,
            email: values.email,
            billingAddress: values.billingAddress ?? "",
            deliveryAddress: values.deliveryAddress ?? "",
            vatNumber: values.vatNumber,
            phone: values.phone ?? "",
            updatedAt: new Date().toISOString(),
          },
        }
        toast.success("Client updated")
        onSaved(updated, "update")
        onOpenChange(false)
      }
    } catch (e: unknown) {
      console.error(e)
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      toast.error(`Failed to save client: ${errorMessage}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{client ? "Edit Client" : "New Client"}</DialogTitle>
          <DialogDescription>{client ? "Update client details" : "Create a new client"}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field, fieldState }) => {
                  const errId = fieldState.error ? "name-error" : undefined
                  return (
                    <FormItem>
                      <FormLabel htmlFor="name">Contact name</FormLabel>
                      <FormControl>
                        <Input id="name" {...field} aria-invalid={!!fieldState.error} aria-describedby={errId} />
                      </FormControl>
                      {fieldState.error ? (
                        <p id="name-error" className="text-sm font-medium text-destructive" role="alert">
                          {fieldState.error.message}
                        </p>
                      ) : (
                        <FormMessage />
                      )}
                    </FormItem>
                  )
                }}
              />
              <FormField
                control={form.control}
                name="company"
                render={({ field, fieldState }) => {
                  const errId = fieldState.error ? "company-error" : undefined
                  return (
                    <FormItem>
                      <FormLabel htmlFor="company">Company</FormLabel>
                      <FormControl>
                        <Input id="company" {...field} aria-invalid={!!fieldState.error} aria-describedby={errId} />
                      </FormControl>
                      {fieldState.error ? (
                        <p id="company-error" className="text-sm font-medium text-destructive" role="alert">
                          {fieldState.error.message}
                        </p>
                      ) : (
                        <FormMessage />
                      )}
                    </FormItem>
                  )
                }}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field, fieldState }) => {
                  const errId = fieldState.error ? "email-error" : undefined
                  return (
                    <FormItem>
                      <FormLabel htmlFor="email">Email</FormLabel>
                      <FormControl>
                        <Input
                          id="email"
                          type="email"
                          autoComplete="email"
                          {...field}
                          aria-invalid={!!fieldState.error}
                          aria-describedby={errId}
                        />
                      </FormControl>
                      {fieldState.error ? (
                        <p id="email-error" className="text-sm font-medium text-destructive" role="alert">
                          {fieldState.error.message}
                        </p>
                      ) : (
                        <FormMessage />
                      )}
                    </FormItem>
                  )
                }}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="phone">Phone</FormLabel>
                    <FormControl>
                      <Input id="phone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billingAddress"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel htmlFor="billingAddress">Billing address</FormLabel>
                    <FormControl>
                      <Input id="billingAddress" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deliveryAddress"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel htmlFor="deliveryAddress">Delivery address</FormLabel>
                    <FormControl>
                      <Input id="deliveryAddress" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vatNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="vatNumber">VAT number</FormLabel>
                    <FormControl>
                      <Input id="vatNumber" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : client ? "Save changes" : "Create client"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
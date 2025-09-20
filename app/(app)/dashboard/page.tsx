"use client"

import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import { m } from "@/components/ui/motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { fetchCompanySettings, fetchInvoices, fetchQuotes, formatCurrency, formatDateISO, humanizeStatus } from "@/lib/mappers"
import type { CompanySettings, Invoice, Quote } from "@/lib/invoice-types"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const [s, qs, is] = await Promise.all([fetchCompanySettings(), fetchQuotes(), fetchInvoices()])
        if (!mounted) return
        setSettings(s)
        setQuotes(qs)
        setInvoices(is)
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const kpis = useMemo(() => {
    const openQuotes = quotes.filter((q) => q.status === "sent").length
    const outstandingDeposits = invoices.filter((i) => i.status === "sent" && i.depositRequired).length
    const overdueInvoices = invoices.filter((i) => i.status === "overdue").length
    return [
      { title: "Total Quotes", value: quotes.length },
      { title: "Open Quotes", value: openQuotes },
      { title: "Outstanding Deposits", value: outstandingDeposits },
      { title: "Overdue Invoices", value: overdueInvoices },
    ]
  }, [quotes, invoices])

  const recentQuotes = useMemo(() => quotes.slice(0, 4), [quotes])
  const recentInvoices = useMemo(() => invoices.slice(0, 4), [invoices])

  return (
    <m.div
      className="space-y-6"
      initial={{ opacity: 0, y: 4, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0)" }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: "transform, opacity, filter" }}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.title} title={k.title} value={String(k.value)} description=" " loading={loading} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <m.div layout className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent quotes</CardTitle>
              <CardDescription>Latest 4 quotes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading && (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-2/3 shimmer" />
                  <Skeleton className="h-4 w-1/2 shimmer" />
                  <Skeleton className="h-4 w-3/5 shimmer" />
                </div>
              )}
              {!loading && recentQuotes.length === 0 && (
                <p className="text-sm text-muted-foreground">No quotes yet.</p>
              )}
              {!loading &&
                recentQuotes.map((q) => (
                  <m.div
                    key={q.id}
                    className="flex items-center justify-between gap-3"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{q.quoteNumber}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        Issued {formatDateISO(q.dateIssued)} • Total{" "}
                        {formatCurrency(q.totalInclVat, settings?.currency ?? "ZAR")}
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {humanizeStatus(q.status)}
                    </Badge>
                  </m.div>
                ))}
            </CardContent>
          </Card>
        </m.div>

        <m.div layout>
          <Card>
            <CardHeader>
              <CardTitle>Recent invoices</CardTitle>
              <CardDescription>Latest 4 invoices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading && (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-2/3 shimmer" />
                  <Skeleton className="h-4 w-1/2 shimmer" />
                  <Skeleton className="h-4 w-3/5 shimmer" />
                </div>
              )}
              {!loading && recentInvoices.length === 0 && (
                <p className="text-sm text-muted-foreground">No invoices yet.</p>
              )}
              {!loading &&
                recentInvoices.map((i) => (
                  <m.div
                    key={i.id}
                    className="space-y-1"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium">{i.invoiceNumber}</p>
                      <Badge variant="secondary" className="capitalize">
                        {humanizeStatus(i.status)}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      Due {formatDateISO(i.dueDate)} • Total {formatCurrency(i.totalInclVat, settings?.currency ?? "ZAR")}
                    </p>
                    <Separator />
                  </m.div>
                ))}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Collection progress</span>
                  <span>{Math.min(100, Math.round((recentInvoices.length / Math.max(1, invoices.length)) * 100))}%</span>
                </div>
                <Progress
                  value={Math.min(100, (recentInvoices.length / Math.max(1, invoices.length)) * 100)}
                />
              </div>
            </CardContent>
          </Card>
        </m.div>
      </div>
    </m.div>
  )
}

function KpiCard({
  title,
  value,
  description,
  loading,
}: {
  title: string
  value: string
  description: string
  loading?: boolean
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card aria-busy={loading} aria-live="polite" className="transition-transform will-change-transform">
        <CardHeader className="pb-2">
          <CardDescription>{title}</CardDescription>
          {loading ? <Skeleton className="h-8 w-16 shimmer" /> : <CardTitle className="text-3xl">{value}</CardTitle>}
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{description}</CardContent>
      </Card>
    </m.div>
  )
}
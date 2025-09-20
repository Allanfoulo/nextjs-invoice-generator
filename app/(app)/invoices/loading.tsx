"use client"

import { m } from "@/components/ui/motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table"

export default function Loading() {
  return (
    <m.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="shimmer pulse-subtle">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-28 shimmer" />
          <Skeleton className="h-3 w-48 shimmer" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toolbar skeleton */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Skeleton className="h-9 w-full sm:w-64 shimmer" />
            <Skeleton className="h-9 w-40 shimmer" />
            <div className="grow" />
          </div>

          {/* Table skeleton */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {[...Array(6)].map((_, i) => (
                    <TableHead key={i}>
                      <Skeleton className="h-3 w-20 shimmer" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(6)].map((_, r) => (
                  <TableRow key={r}>
                    {[...Array(6)].map((_, c) => (
                      <TableCell key={c}>
                        <Skeleton className="h-3 w-24 shimmer" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </m.div>
  )
}
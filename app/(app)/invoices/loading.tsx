"use client"

import { m } from "@/components/ui/motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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
          <div className="space-y-4">
            {/* Desktop skeleton */}
            <div className="hidden sm:block rounded-md border">
              <div className="bg-muted/50 p-2">
                <div className="grid grid-cols-7 gap-2">
                  {[...Array(7)].map((_, i) => (
                    <Skeleton key={i} className="h-3 w-20 shimmer" />
                  ))}
                </div>
              </div>
              <div className="p-2 space-y-2">
                {[...Array(6)].map((_, r) => (
                  <div key={r} className="grid grid-cols-7 gap-2">
                    {[...Array(7)].map((_, c) => (
                      <Skeleton key={c} className="h-3 w-24 shimmer" />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile skeleton */}
            <div className="sm:hidden space-y-4">
              {[...Array(6)].map((_, r) => (
                <div key={r} className="bg-muted/30 rounded-lg p-4 space-y-3">
                  {[...Array(7)].map((_, c) => (
                    <div key={c} className="flex justify-between">
                      <Skeleton className="h-3 w-16 shimmer" />
                      <Skeleton className="h-3 w-20 shimmer" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </m.div>
  )
}
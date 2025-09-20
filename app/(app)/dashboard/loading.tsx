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
      {/* KPI skeletons */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <m.div key={i} layout>
            <Card className="shimmer pulse-subtle">
              <CardHeader className="pb-2">
                <Skeleton className="h-3 w-24 shimmer" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 shimmer" />
              </CardContent>
            </Card>
          </m.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left chart/content skeleton */}
        <m.div layout className="lg:col-span-2">
          <Card className="shimmer pulse-subtle">
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-48 w-full shimmer" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-1/3 shimmer" />
                <Skeleton className="h-2 w-3/4 shimmer" />
              </div>
            </CardContent>
          </Card>
        </m.div>

        {/* Recent activity skeleton */}
        <m.div layout>
          <Card className="shimmer pulse-subtle">
            <CardContent className="pt-6 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-2/3 shimmer" />
                  <Skeleton className="h-2 w-1/2 shimmer" />
                </div>
              ))}
            </CardContent>
          </Card>
        </m.div>
      </div>
    </m.div>
  )
}
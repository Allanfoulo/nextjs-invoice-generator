"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ResponsiveTableProps {
  headers: string[]
  data: Array<{
    id: string
    cells: React.ReactNode[]
    action?: React.ReactNode
  }>
  loading?: boolean
  emptyMessage?: string
  className?: string
}

export function ResponsiveTable({
  headers,
  data,
  loading = false,
  emptyMessage = "No data found",
  className = ""
}: ResponsiveTableProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-muted animate-pulse rounded-lg p-4 space-y-3">
            {[...Array(headers.length)].map((_, j) => (
              <div key={j} className="flex justify-between">
                <div className="h-4 bg-muted-foreground/20 rounded w-24"></div>
                <div className="h-4 bg-muted-foreground/20 rounded w-32"></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table */}
      <div className={`hidden sm:block rounded-md border ${className}`}>
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className={`text-left p-2 font-medium whitespace-nowrap ${
                    index === headers.length - 1 ? "text-right" : ""
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="border-b hover:bg-muted/50 transition-colors"
              >
                {row.cells.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`p-2 align-middle whitespace-nowrap ${
                      cellIndex === row.cells.length - 1 ? "text-right" : ""
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-4">
        {data.map((row, rowIndex) => (
          <motion.div
            key={row.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="bg-card border rounded-lg p-4 space-y-3 shadow-sm"
          >
            {row.cells.map((cell, cellIndex) => (
              <div key={cellIndex} className="flex justify-between items-start gap-2">
                <span className="text-sm font-medium text-muted-foreground min-w-[80px] flex-shrink-0">
                  {headers[cellIndex]}
                </span>
                <span className="text-sm text-right flex-1 break-words">
                  {cell}
                </span>
              </div>
            ))}
            {row.action && (
              <div className="pt-2 border-t">
                {row.action}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </>
  )
}
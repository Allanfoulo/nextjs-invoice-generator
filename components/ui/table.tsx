"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm hidden sm:table", className)}
        {...props}
      />
      {/* Mobile vertical layout */}
      <div
        data-slot="mobile-table"
        className="sm:hidden space-y-4"
      >
        {React.Children.map(props.children, (child, index) => {
          if (React.isValidElement(child) && child.type === TableBody) {
            return React.Children.map(child.props.children, (row, rowIndex) => {
              if (React.isValidElement(row) && row.type === TableRow) {
                return (
                  <div key={rowIndex} className="bg-card border rounded-lg p-4 space-y-3">
                    {React.Children.map(row.props.children, (cell, cellIndex) => {
                      if (React.isValidElement(cell) && cell.type === TableCell) {
                        // Get the corresponding header text
                        const headers = React.Children.map(
                          React.Children.toArray(props.children).find(
                            c => React.isValidElement(c) && c.type === TableHeader
                          )?.props.children,
                          (headerRow) => {
                            if (React.isValidElement(headerRow)) {
                              return React.Children.map(headerRow.props.children, (headerCell) => {
                                if (React.isValidElement(headerCell) && headerCell.type === TableHead) {
                                  return headerCell.props.children;
                                }
                                return null;
                              });
                            }
                            return null;
                          }
                        )?.filter(Boolean) || [];

                        const headerText = headers[cellIndex] || `Field ${cellIndex + 1}`;

                        return (
                          <div key={cellIndex} className="flex justify-between items-start">
                            <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                              {headerText}
                            </span>
                            <span className="text-sm text-right max-w-[60%] break-words">
                              {cell.props.children}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                );
              }
              return null;
            });
          }
          return null;
        })}
      </div>
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors sm:border-b",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 sm:px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 sm:p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}

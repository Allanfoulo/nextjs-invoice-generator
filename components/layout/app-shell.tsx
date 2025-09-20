"use client"

import * as React from "react"
import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-rows-[auto,1fr] md:grid-cols-[16rem,1fr]">
      {/* Header spans full width */}
      <div className="md:col-span-2 md:row-start-1">
        <AppHeader />
      </div>

      {/* Desktop persistent sidebar */}
      <aside className="w-64 shrink-0 border-r bg-background">
        <AppSidebar />
      </aside>

      {/* Main content */}
      <main id="main-content" className="p-4 md:p-6 md:col-start-2 md:row-start-2">
        {children}
      </main>
    </div>
  )
}
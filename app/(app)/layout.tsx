import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import PathnameClient from "@/components/layout/pathname-client"
import { MotionProvider } from "@/components/ui/motion"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MotionProvider>
      <AppShell>
        <PathnameClient>{children}</PathnameClient>
      </AppShell>
    </MotionProvider>
  )
}
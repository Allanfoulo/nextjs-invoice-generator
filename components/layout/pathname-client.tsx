"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence } from "framer-motion"
import { m, fadeInUp } from "@/components/ui/motion"

export default function PathnameClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={pathname}
        initial={fadeInUp.initial}
        animate={fadeInUp.animate}
        exit={fadeInUp.exit}
        style={{ willChange: "transform, opacity, filter" }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  )
}
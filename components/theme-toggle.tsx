"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * Fixed ThemeToggle to avoid hydration mismatch:
 * - Render a stable server/client fallback label "Toggle color theme" on first render
 * - After mount, determine actual theme and update aria-label/sr-only and tooltip text
 *
 * This keeps server HTML identical to the initial client render and prevents
 * the "Hydration failed because the server rendered text didn't match the client" error.
 */

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Resolve current theme only after mount to avoid reading client-only values during SSR/hydration
  const resolved = mounted ? (theme === "system" ? systemTheme : theme) : null
  const isDark = resolved === "dark"

  const neutralLabel = "Toggle color theme"
  const liveLabel = isDark ? "Switch to light theme" : "Switch to dark theme"
  const ariaLabel = mounted && resolved ? liveLabel : neutralLabel
  const tooltipText = mounted && resolved ? (isDark ? "Light mode" : "Dark mode") : "Toggle color theme"

  function toggle() {
    if (!mounted) return
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={ariaLabel}
            data-state={mounted && resolved ? (isDark ? "dark" : "light") : "unknown"}
          >
            {/* Keep the structure identical during initial render to avoid mismatches */}
            <span aria-hidden="true" className="relative inline-flex h-5 w-5">
              <Sun className={`absolute inset-0 h-5 w-5 transition-all ${mounted && isDark ? "opacity-0 scale-75" : "opacity-100 scale-100"}`} />
              <Moon className={`absolute inset-0 h-5 w-5 transition-all ${mounted && isDark ? "opacity-100 scale-100" : "opacity-0 scale-75"}`} />
            </span>
            <span className="sr-only">{ariaLabel}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tooltipText}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
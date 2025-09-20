"use client"

import * as React from "react"
import { m } from "@/components/ui/motion"

export function InlineSpinner({
  className = "",
  size = 14,
  "aria-label": ariaLabel = "Loading",
}: {
  className?: string
  size?: number
  "aria-label"?: string
}) {
  // Simple dot spinner that fades in/out; respects reduced motion via MotionConfig
  return (
    <m.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-label={ariaLabel}
      role="status"
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.9 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: "opacity" }}
    >
      <m.circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="44"
        strokeDashoffset="0"
        animate={{
          strokeDashoffset: [0, 44],
          rotate: [0, 360],
        }}
        transition={{
          repeat: Infinity,
          duration: 0.9,
          ease: "linear",
        }}
      />
    </m.svg>
  )
}
"use client"

import * as React from "react"
import { MotionConfig, motion, type Transition } from "framer-motion"

export const transitions = {
  // Subtle premium feel: 180–280ms, custom ease
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  durationSm: 0.18,
  durationMd: 0.24,
  durationLg: 0.28,
}

export const softSpring = {
  type: "spring",
  stiffness: 420,
  damping: 30,
  mass: 0.7,
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { ...softSpring, mass: 0.6 } as Transition },
  exit: { opacity: 0, scale: 0.98, transition: { duration: transitions.durationSm, ease: transitions.ease } },
}

export const fadeInUp = {
  initial: { opacity: 0, y: 4, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: transitions.durationMd, ease: transitions.ease } },
  exit: { opacity: 0, y: -4, filter: "blur(4px)", transition: { duration: transitions.durationSm, ease: transitions.ease } },
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  // Reduced motion is picked up from OS preference; user setting respected
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: transitions.durationMd, ease: transitions.ease }}>
      {children}
    </MotionConfig>
  )
}

// Convenience exports
export const m = motion
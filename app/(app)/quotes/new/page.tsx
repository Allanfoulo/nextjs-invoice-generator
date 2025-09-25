"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { QuoteEditor } from "../_components/quote-editor"

export default function NewQuotePage() {
  const router = useRouter()

  const handleSave = () => {
    router.push("/quotes")
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <QuoteEditor
      quote={null}
      onSaved={handleSave}
      onCancel={handleCancel}
    />
  )
}
'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Palette, Check } from "lucide-react"
import { TemplateEngine, TemplateStyle, DocumentType } from "@/lib/pdf-templates/template-engine"

// Helper function to convert CSS color classes to readable names
function getColorName(colorClass: string): string {
  const colorMap: { [key: string]: string } = {
    'text-blue-600': 'Blue',
    'text-green-600': 'Green',
    'text-gray-900': 'Black',
    'text-gray-700': 'Gray',
    'text-blue-900': 'Navy',
    'text-green-900': 'Dark Green',
    'text-gray-600': 'Medium Gray'
  }

  return colorMap[colorClass] || colorClass.replace('text-', '').replace(/-\d+/, '').replace(/([A-Z])/g, ' $1').trim()
}

interface TemplateSelectorProps {
  currentStyle: TemplateStyle
  onStyleChange: (style: TemplateStyle) => void
  documentType: DocumentType
  children: React.ReactNode
  settings?: {
    companyName?: string
    currency?: string
  }
}

export function TemplateSelector({ currentStyle, onStyleChange, documentType, children, settings: _settings }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const templates: { style: TemplateStyle; name: string; description: string }[] = [
    { style: "modern", name: "Modern", description: "Contemporary design with gradient headers" },
    { style: "classic", name: "Classic", description: "Traditional black and white layout" },
    { style: "minimal", name: "Minimal", description: "Clean design with subtle styling" }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Choose Template Style
          </DialogTitle>
          <DialogDescription>
            Select a template style for your {documentType}. The preview shows how it will look.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-x-auto">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6 min-w-fit">
            {templates.map((template) => {
              const preview = TemplateEngine.getTemplatePreview(template.style, documentType)
              const isSelected = currentStyle === template.style

              return (
                <Card
                  key={template.style}
                  className={`cursor-pointer transition-all hover:shadow-md flex-shrink-0 w-full sm:w-80 ${
                    isSelected ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => onStyleChange(template.style)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {isSelected && <Check className="h-4 w-4 text-green-500" />}
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Header Preview */}
                      <div className={`h-12 rounded ${preview.header} flex items-center justify-center`}>
                        <span className="text-white text-sm font-medium">Header</span>
                      </div>

                      {/* Accent Preview */}
                      <div className="flex items-center justify-between text-sm">
                         <span>Accent color:</span>
                         <Badge variant="outline" className={preview.accent}>
                           {getColorName(preview.accent)}
                         </Badge>
                       </div>

                      {/* Features */}
                      <div className="space-y-1 text-xs text-gray-600">
                        <p>• Professional layout</p>
                        <p>• Responsive design</p>
                        <p>• Custom branding</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 pt-0 flex-shrink-0">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setIsOpen(false)}>
            Apply Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
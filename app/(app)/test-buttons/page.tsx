"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestButtonsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Button Text Overflow Test</CardTitle>
          <CardDescription>Testing various button text scenarios to ensure text stays within boundaries</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Normal buttons */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Normal Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <Button>Short Text</Button>
              <Button>Medium Length Button Text</Button>
              <Button>This is a very long button text that should wrap properly</Button>
            </div>
          </div>

          {/* Small buttons */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Small Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <Button size="sm">Short</Button>
              <Button size="sm">Medium Text</Button>
              <Button size="sm">Very long text for small button</Button>
            </div>
          </div>

          {/* Buttons with icons */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Buttons with Icons</h3>
            <div className="flex flex-wrap gap-4">
              <Button>
                <span className="mr-2">📄</span>
                Generate PDF Document
              </Button>
              <Button size="sm">
                <span className="mr-2">✉️</span>
                Send Email Notification
              </Button>
            </div>
          </div>

          {/* Constrained width buttons */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Constrained Width Buttons</h3>
            <div className="space-y-4">
              <div className="w-48">
                <Button className="w-full">This button has very long text in a constrained space</Button>
              </div>
              <div className="w-32">
                <Button className="w-full">Supercalifragilisticexpialidocious button text</Button>
              </div>
              <div className="w-24">
                <Button className="w-full">Extremely long text that should truncate</Button>
              </div>
            </div>
          </div>

          {/* Different variants */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Different Variants</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline">Outline button with long text</Button>
              <Button variant="destructive">Destructive button with long text</Button>
              <Button variant="ghost">Ghost button with long text</Button>
              <Button variant="secondary">Secondary button with long text</Button>
            </div>
          </div>

          {/* Real-world examples */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Real-world Examples</h3>
            <div className="flex flex-wrap gap-4">
              <Button>
                <span className="mr-2">💾</span>
                Save Quote and Generate PDF
              </Button>
              <Button variant="outline">
                <span className="mr-2">📧</span>
                Send Quote to Client via Email
              </Button>
              <Button size="sm" variant="destructive">
                <span className="mr-2">🗑️</span>
                Delete This Quote Permanently
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
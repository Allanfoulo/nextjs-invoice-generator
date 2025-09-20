import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function NotFound() {
  return (
    <div className="min-h-[60vh] grid place-items-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Page not found</CardTitle>
          <CardDescription>The page you are looking for does not exist or has moved.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/projects">View Projects</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/login">Back to Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
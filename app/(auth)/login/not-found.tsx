import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-[60vh] grid place-items-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Login page not found</CardTitle>
          <CardDescription>The requested login resource could not be found.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/login">Back to Login</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
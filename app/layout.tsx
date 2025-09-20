import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import NextTopLoader from "nextjs-toploader"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Login | next-shadcn-auth",
  description: "Modern accessible login UI with shadcn/ui, RHF, and Zod",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen bg-background`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextTopLoader
            color="hsl(var(--primary))"
            initialPosition={0.2}
            crawlSpeed={120}
            height={2}
            crawl
            showSpinner={false}
            easing="cubic-bezier(0.22,1,0.36,1)"
            speed={200}
            zIndex={1600}
          />
          {children}
          <Toaster richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}

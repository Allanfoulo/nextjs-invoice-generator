"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Menu,
  LayoutDashboard,
  FileText,
  Receipt,
  Users,
  Settings as SettingsIcon,
  Search,
  LogOut,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { AppSidebar } from "./app-sidebar"

export function AppHeader() {
  const router = useRouter()
  const { logout } = useAuth()
  const [open, setOpen] = React.useState(false)

  async function handleLogout() {
    await logout()
    toast.success("Signed out")
    router.replace("/login")
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-3 sm:px-4">
        {/* Mobile: sidebar sheet trigger */}
        <div className="mr-2 flex sm:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <SheetHeader className="px-4 py-3">
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <Separator />
              <AppSidebar onNavigate={() => setOpen(false)} className="p-2" />
            </SheetContent>
          </Sheet>
        </div>

        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="text-primary">
            <path
              fill="currentColor"
              d="M11 21H4a1 1 0 0 1-1-1v-7h8v8Zm10-7v6a1 1 0 0 1-1 1h-7v-7h8Zm-10-2H3V4a1 1 0 0 1 1-1h7v8Zm2-8h7a1 1 0 0 1 1 1v7h-8V4Z"
            />
          </svg>
          <span className="hidden sm:inline">Invoice Generator</span>
        </Link>

        {/* Search (visual only) */}
        <div className="ml-3 flex-1 sm:ml-6">
          <div className="relative max-w-md">
            <Search
              className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input type="search" placeholder="Search (visual only)" className="pl-8" aria-label="Global search" />
          </div>
        </div>


        <div className="ml-2 flex items-center gap-1 sm:gap-2">
          <ThemeToggle />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Open user menu">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=next" alt="User" />
                  <AvatarFallback>
                    <User className="h-4 w-4" aria-hidden="true" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { type LoginFormValues, loginSchema } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2, Github, Chrome } from "lucide-react"
import { useAuth } from "@/lib/auth"

export function LoginForm() {
  const router = useRouter()
  const { login: setSessionToken } = useAuth()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
    mode: "onTouched",
  })

  const [showPassword, setShowPassword] = useState(false)

  async function onSubmit(values: LoginFormValues) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      const data = await res.json()

      if (!res.ok) {
        const message = data?.error ?? "Invalid credentials"
        // Show server error inline and via toast
        try {
          // Prefer setting the password field, or email as a generic surface
          form.setError("password" as any, { message })
        } catch {
          // fallback if types complain in strict mode
        }
        toast.error(message)
        return
      }

      // Demo: store a visible token for middleware checks (NOT secure)
      const demoToken = "mock-session-token"
      setSessionToken(demoToken, values.remember)
      try {
        window.sessionStorage.setItem("demo_email", values.email)
      } catch {
        // ignore
      }

      toast.success("Signed in successfully")
      router.replace("/dashboard")
    } catch (err) {
      toast.error("Something went wrong. Please try again.")
    }
  }

  const isSubmitting = form.formState.isSubmitting

  return (
    <Form {...form}>
      <form
        className="space-y-6"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        aria-describedby="form-status"
      >
        <div className="space-y-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => {
              const errorId = fieldState.error ? "email-error" : undefined
              return (
                <FormItem>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <FormControl>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      aria-invalid={!!fieldState.error}
                      aria-describedby={errorId}
                      {...field}
                    />
                  </FormControl>
                  {fieldState.error ? (
                    <p
                      id="email-error"
                      className="text-sm font-medium text-destructive"
                      role="alert"
                    >
                      {fieldState.error.message}
                    </p>
                  ) : (
                    <FormMessage />
                  )}
                </FormItem>
              )
            }}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => {
              const errorId = fieldState.error ? "password-error" : undefined
              return (
                <FormItem>
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        aria-invalid={!!fieldState.error}
                        aria-describedby={errorId}
                        {...field}
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {fieldState.error ? (
                    <p
                      id="password-error"
                      className="text-sm font-medium text-destructive"
                      role="alert"
                    >
                      {fieldState.error.message}
                    </p>
                  ) : (
                    <FormMessage />
                  )}
                </FormItem>
              )
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="remember"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    id="remember"
                    checked={!!field.value}
                    onCheckedChange={(checked) => field.onChange(!!checked)}
                    aria-describedby="remember-hint"
                  />
                </FormControl>
                <div className="grid gap-0.5 leading-none">
                  <FormLabel htmlFor="remember" className="font-normal">
                    Remember me
                  </FormLabel>
                  <p id="remember-hint" className="sr-only">
                    Keep me signed in on this device
                  </p>
                </div>
              </FormItem>
            )}
          />

          <a
            className="text-sm text-primary underline-offset-4 hover:underline"
            href="#"
          >
            Forgot password?
          </a>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>

        <div className="text-sm text-center text-muted-foreground">
          Don’t have an account?{" "}
          <a
            className="font-medium text-primary underline-offset-4 hover:underline"
            href="#"
          >
            Sign up
          </a>
        </div>

        <div className="relative">
          <Separator />
          <div className="absolute inset-0 -top-3 flex justify-center">
            <span className="bg-background px-2 text-xs text-muted-foreground">
              or continue with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => toast.info("Wire Google OAuth here")}
            className="w-full"
          >
            <Chrome className="mr-2 h-4 w-4" aria-hidden="true" />
            Google
            <span className="sr-only">Sign in with Google</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => toast.info("Wire GitHub OAuth here")}
            className="w-full"
          >
            <Github className="mr-2 h-4 w-4" aria-hidden="true" />
            GitHub
            <span className="sr-only">Sign in with GitHub</span>
          </Button>
        </div>

        {/* Live region for form status updates */}
        <div id="form-status" className="sr-only" aria-live="polite" role="status">
          {isSubmitting ? "Submitting" : "Idle"}
        </div>
      </form>
    </Form>
  )
}
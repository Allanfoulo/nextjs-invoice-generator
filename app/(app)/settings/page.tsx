"use client"

import * as React from "react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { settingsSchema, type SettingsFormValues } from "@/lib/validations/settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      email: "",
      bio: "",
      notifications: true,
    },
    mode: "onTouched",
  })

  // Prefill email from demo login if available
  useEffect(() => {
    try {
      const email = window.sessionStorage.getItem("demo_email")
      if (email) {
        form.setValue("email", email, { shouldValidate: true })
      }
    } catch {
      // ignore
    }
  }, [form])

  const isSubmitting = form.formState.isSubmitting

  async function onSubmit(values: SettingsFormValues) {
    try {
      // Simulate saving
      await new Promise((r) => setTimeout(r, 700))
      toast.success("Settings saved")
    } catch {
      toast.error("Failed to save settings")
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your profile information and preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => {
                    const errId = fieldState.error ? "name-error" : undefined
                    return (
                      <FormItem>
                        <FormLabel htmlFor="name">Name</FormLabel>
                        <FormControl>
                          <Input
                            id="name"
                            placeholder="Your name"
                            aria-invalid={!!fieldState.error}
                            aria-describedby={errId}
                            {...field}
                          />
                        </FormControl>
                        {fieldState.error ? (
                          <p id="name-error" className="text-sm font-medium text-destructive" role="alert">
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
                  name="email"
                  render={({ field, fieldState }) => {
                    const errId = fieldState.error ? "email-error" : undefined
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
                            aria-describedby={errId}
                            {...field}
                          />
                        </FormControl>
                        {fieldState.error ? (
                          <p id="email-error" className="text-sm font-medium text-destructive" role="alert">
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

              <FormField
                control={form.control}
                name="bio"
                render={({ field, fieldState }) => {
                  const errId = fieldState.error ? "bio-error" : undefined
                  return (
                    <FormItem>
                      <FormLabel htmlFor="bio">Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          id="bio"
                          placeholder="Short bio (max 300 chars)"
                          className="min-h-[100px]"
                          aria-invalid={!!fieldState.error}
                          aria-describedby={errId}
                          {...field}
                        />
                      </FormControl>
                      {fieldState.error ? (
                        <p id="bio-error" className="text-sm font-medium text-destructive" role="alert">
                          {fieldState.error.message}
                        </p>
                      ) : (
                        <FormMessage />
                      )}
                    </FormItem>
                  )
                }}
              />

              <Separator />

              <FormField
                control={form.control}
                name="notifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Email notifications</FormLabel>
                      <p className="text-sm text-muted-foreground">Receive updates about activity and changes.</p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={!!field.value}
                        onCheckedChange={(checked) => field.onChange(!!checked)}
                        aria-label="Toggle email notifications"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
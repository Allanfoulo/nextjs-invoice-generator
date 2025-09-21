"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Save, User, ImagePlus, X } from "lucide-react"
import Image from "next/image"
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
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  bio: z.string().max(300, "Bio must be less than 300 characters").optional(),
  website: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  location: z.string().optional(),
  company: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const bannerInputRef = React.useRef<HTMLInputElement>(null)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      bio: "",
      website: "",
      location: "",
      company: "",
    },
    mode: "onTouched",
  })

  useEffect(() => {
    loadProfile()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadProfile = async () => {
    try {
      setLoading(true)

      // Get current authenticated user from Supabase
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      if (user) {
        // Set form values from user metadata
        form.reset({
          name: user.user_metadata?.name || user.email?.split('@')[0] || "",
          email: user.email || "",
          bio: user.user_metadata?.bio || "",
          website: user.user_metadata?.website || "",
          location: user.user_metadata?.location || "",
          company: user.user_metadata?.company || "",
        })

        // Set avatar and banner from user metadata
        setAvatarUrl(user.user_metadata?.avatar_url || null)
        setBannerUrl(user.user_metadata?.banner_url || null)
      }

    } catch (error) {
      console.error("Failed to load profile:", error)
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const fileExt = file.name.split('.').pop()
      const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      setAvatarUrl(data.publicUrl)

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: data.publicUrl }
      })

      if (updateError) throw updateError

      toast.success("Avatar updated successfully")
    } catch (error) {
      console.error("Avatar upload failed:", error)
      toast.error("Failed to upload avatar")
    }
  }

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const fileExt = file.name.split('.').pop()
      const fileName = `banner-${user.id}-${Date.now()}.${fileExt}`
      const filePath = `banners/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      setBannerUrl(data.publicUrl)

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { banner_url: data.publicUrl }
      })

      if (updateError) throw updateError

      toast.success("Banner updated successfully")
    } catch (error) {
      console.error("Banner upload failed:", error)
      toast.error("Failed to upload banner")
    }
  }

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      setSaving(true)

      // Update user metadata in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        data: {
          name: values.name,
          bio: values.bio,
          website: values.website,
          location: values.location,
          company: values.company,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
        }
      })

      if (error) throw error

      toast.success("Profile updated successfully")
    } catch (error) {
      console.error("Failed to update profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* Profile Banner */}
      <Card>
        <div className="relative h-32 overflow-hidden rounded-t-lg bg-gradient-to-r from-blue-500 to-purple-600">
          {bannerUrl && (
            <Image
              src={bannerUrl}
              alt="Profile banner"
              width={800}
              height={128}
              className="h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => bannerInputRef.current?.click()}
              className="bg-white/90 hover:bg-white text-gray-900"
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              {bannerUrl ? "Change Banner" : "Add Banner"}
            </Button>
            {bannerUrl && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBannerUrl(null)}
                className="ml-2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerUpload}
            className="hidden"
          />
        </div>

        {/* Profile Avatar */}
        <CardContent className="relative pb-6">
          <div className="absolute -top-12 left-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={avatarUrl || undefined} alt="Profile picture" />
                <AvatarFallback>
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="secondary"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>

          <div className="pt-16">
            <CardTitle className="text-xl">Profile Information</CardTitle>
            <CardDescription>Update your personal information and profile settings.</CardDescription>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel htmlFor="name">Full Name</FormLabel>
                      <FormControl>
                        <Input
                          id="name"
                          placeholder="Your full name"
                          aria-invalid={!!fieldState.error}
                          aria-describedby={fieldState.error ? "name-error" : undefined}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel htmlFor="email">Email</FormLabel>
                      <FormControl>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          autoComplete="email"
                          aria-invalid={!!fieldState.error}
                          aria-describedby={fieldState.error ? "email-error" : undefined}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel htmlFor="location">Location</FormLabel>
                      <FormControl>
                        <Input
                          id="location"
                          placeholder="City, Country"
                          aria-invalid={!!fieldState.error}
                          aria-describedby={fieldState.error ? "location-error" : undefined}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel htmlFor="company">Company</FormLabel>
                      <FormControl>
                        <Input
                          id="company"
                          placeholder="Your company"
                          aria-invalid={!!fieldState.error}
                          aria-describedby={fieldState.error ? "company-error" : undefined}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="website"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel htmlFor="website">Website</FormLabel>
                    <FormControl>
                      <Input
                        id="website"
                        type="url"
                        placeholder="https://yourwebsite.com"
                        aria-invalid={!!fieldState.error}
                        aria-describedby={fieldState.error ? "website-error" : undefined}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel htmlFor="bio">Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        id="bio"
                        placeholder="Tell us a little about yourself..."
                        className="min-h-[100px]"
                        maxLength={300}
                        aria-invalid={!!fieldState.error}
                        aria-describedby={fieldState.error ? "bio-error" : undefined}
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between">
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        {field.value?.length || 0}/300 characters
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <Separator />

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
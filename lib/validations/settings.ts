import { z } from "zod"

export const settingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address"),
  bio: z
    .string()
    .trim()
    .max(300, "Bio must be 300 characters or less")
    .optional()
    .default(""),
  notifications: z.boolean().default(true),
})

export type SettingsFormValues = z.input<typeof settingsSchema>
export type SettingsValues = z.output<typeof settingsSchema>
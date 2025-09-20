import { z } from "zod"

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  // Default makes input optional but output required. We'll export both types.
  remember: z.boolean().default(false),
})

// RHF should use input type
export type LoginFormValues = z.input<typeof loginSchema>
// App logic/output can use the output type
export type LoginValues = z.output<typeof loginSchema>
import { z } from "zod"

export const areaFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "validation.required")
    .max(100, "validation.max100"),
  city: z
    .string()
    .trim()
    .min(1, "validation.required")
    .max(100, "validation.max100"),
})

export type AreaFormValues = z.infer<typeof areaFormSchema>

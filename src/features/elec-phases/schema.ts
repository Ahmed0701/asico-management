import { z } from "zod"

export const elecPhaseFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "validation.required")
    .max(100, "validation.max100"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  // Typed as text, saved as a whole number from 0 to 100.
  progressRatio: z
    .string()
    .trim()
    .regex(/^\d{1,3}$/, "validation.progressRatio")
    .refine((value) => Number(value) <= 100, "validation.progressRatio"),
})

export type ElecPhaseFormValues = z.infer<typeof elecPhaseFormSchema>

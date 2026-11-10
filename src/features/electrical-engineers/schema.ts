import { z } from "zod"
import { optionalEmailField } from "@/shared/validation/optionalEmailField"

const PHONE_PATTERN = /^\+?[0-9][0-9 -]*$/

export const electricalEngineerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "validation.required")
    .max(100, "validation.max100"),
  phone: z
    .string()
    .trim()
    .refine(
      (value) =>
        value.length >= 5 && value.length <= 20 && PHONE_PATTERN.test(value),
      { message: "validation.phoneInvalid" },
    ),
  email: optionalEmailField,
})

export type ElectricalEngineerFormValues = z.infer<typeof electricalEngineerFormSchema>

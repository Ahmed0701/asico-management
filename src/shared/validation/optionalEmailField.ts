import { z } from "zod"

export const optionalEmailField = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || z.string().email().safeParse(value).success,
    {
      message: "validation.email",
    },
  )

export type OptionalEmailField = z.infer<typeof optionalEmailField>

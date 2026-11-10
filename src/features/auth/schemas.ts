import { z } from "zod"

const password = z.string().min(8, "validation.min8")

export const loginSchema = z.object({
  email: z.string().min(1, "validation.required").email("validation.email"),
  password: z.string().min(1, "validation.required"),
})

export const signupSchema = z
  .object({
    name: z.string().min(2, "validation.min2"),
    email: z.string().min(1, "validation.required").email("validation.email"),
    password,
    confirm: z.string().min(1, "validation.required"),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "validation.passwordMatch",
  })

export const forgotSchema = z.object({
  email: z.string().min(1, "validation.required").email("validation.email"),
})

export const resetSchema = z
  .object({ password, confirm: z.string().min(1, "validation.required") })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "validation.passwordMatch",
  })

export const changeSchema = z
  .object({
    current: z.string().min(1, "validation.required"),
    password,
    confirm: z.string().min(1, "validation.required"),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "validation.passwordMatch",
  })

export const profileSchema = z.object({
  name: z.string().min(2, "validation.min2"),
})

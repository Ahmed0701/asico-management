import { z } from "zod"
import { currencyMinorDigits, minorUnitsOf } from "./api/budget"
import { VILLA_TYPES } from "./api/villas.types"

const text50 = z
  .string()
  .trim()
  .min(1, "validation.required")
  .max(50, "validation.textLength")
const ownerName = z.string().trim().max(120, "validation.ownerNameLength")
const uuid = z.string().trim().uuid("validation.idInvalid")
const calendarDay = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "validation.dateInvalid")

export const villaFormSchema = z
  .object({
    villaNumber: text50,
    ownerName: ownerName.optional(),
    // "" until one is picked; the form requires a choice.
    villaType: z
      .string()
      .refine(
        (value) => (VILLA_TYPES as readonly string[]).includes(value),
        "validation.required",
      ),
    areaId: uuid,
    block: text50,
    plot: text50,
    civilEngineerId: uuid,
    electricalEngineerId: z.string().trim(),
    contractorId: z.string().trim(),
    startDate: z.string().trim(),
    targetDate: z.string().trim(),
    budgetMajor: z.string().trim(),
    currency: z.string().trim(),
  })
  .superRefine((values, ctx) => {
    if (values.startDate && !calendarDay.safeParse(values.startDate).success) {
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "validation.dateInvalid",
      })
    }
    if (
      values.targetDate &&
      !calendarDay.safeParse(values.targetDate).success
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["targetDate"],
        message: "validation.dateInvalid",
      })
    }
    if (
      values.startDate &&
      values.targetDate &&
      calendarDay.safeParse(values.startDate).success &&
      calendarDay.safeParse(values.targetDate).success &&
      values.targetDate < values.startDate
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["targetDate"],
        message: "validation.targetBeforeStart",
      })
    }
    const budgetTrimmed = values.budgetMajor.trim()
    if (budgetTrimmed) {
      const cur = values.currency.trim().toUpperCase()
      if (!cur || cur.length !== 3) {
        ctx.addIssue({
          code: "custom",
          path: ["currency"],
          message: "validation.currencyInvalid",
        })
      } else {
        const digits = currencyMinorDigits(cur)
        if (minorUnitsOf(budgetTrimmed, digits) === undefined) {
          ctx.addIssue({
            code: "custom",
            path: ["budgetMajor"],
            message: "validation.budgetInvalid",
          })
        }
      }
    }
  })

export type VillaFormValues = z.infer<typeof villaFormSchema>

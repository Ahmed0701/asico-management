import { z } from "zod"
import {
  isValidLabourCount,
  isValidLabourDateYmd,
  isValidLabourNotesLength,
} from "./lib/dailyLabourFormRules"

const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "validation.dateInvalid" })
  .refine(isValidLabourDateYmd, { message: "validation.reportDateFuture" })

const optionalNotes = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z
    .string()
    .trim()
    .max(500)
    .refine((v) => isValidLabourNotesLength(v), {
      message: "validation.labourNotesTooLong",
    })
    .nullable()
    .optional(),
)

export const dailyLabourCreateSchema = z.object({
  villaId: z.string().uuid(),
  labourDate: dateField,
  contractorId: z.string().uuid(),
  labourCount: z
    .number()
    .refine(isValidLabourCount, { message: "validation.labourCountInvalid" }),
  notes: optionalNotes,
})

export const dailyLabourEditSchema = z.object({
  labourDate: dateField.optional(),
  contractorId: z.string().uuid().optional(),
  labourCount: z
    .number()
    .refine(isValidLabourCount, { message: "validation.labourCountInvalid" })
    .optional(),
  notes: optionalNotes,
})

export type DailyLabourCreateFormValues = z.infer<typeof dailyLabourCreateSchema>
export type DailyLabourEditFormValues = z.infer<typeof dailyLabourEditSchema>

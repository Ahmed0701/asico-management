import { z } from "zod"
import { WEATHERS } from "./api/daily-reports.types"
import {
  isValidReportDateYmd,
  isValidWorkersCount,
} from "./lib/dailyReportsFormRules"

const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "validation.dateInvalid" })
  .refine(isValidReportDateYmd, { message: "validation.reportDateFuture" })

const optionalNotes = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().max(5000).nullable().optional(),
)

export const dailyReportCreateSchema = z.object({
  contractorId: z.string().uuid({ message: "validation.required" }),
  preparedByEngineerId: z.string().uuid({ message: "validation.required" }),
  reportDate: dateField,
  weather: z.enum(WEATHERS),
  workersCount: z
    .number()
    .refine(isValidWorkersCount, { message: "validation.workersCountInvalid" }),
  notes: optionalNotes,
})

export const dailyReportEditSchema = z.object({
  contractorId: z.string().uuid().optional(),
  preparedByEngineerId: z.string().uuid().optional(),
  reportDate: dateField.optional(),
  weather: z.enum(WEATHERS).optional(),
  workersCount: z
    .number()
    .refine(isValidWorkersCount, { message: "validation.workersCountInvalid" })
    .optional(),
  notes: optionalNotes,
})

export type DailyReportCreateFormValues = z.infer<typeof dailyReportCreateSchema>
export type DailyReportEditFormValues = z.infer<typeof dailyReportEditSchema>

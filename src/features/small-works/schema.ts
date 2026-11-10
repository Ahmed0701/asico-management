import { z } from "zod"
import { SMALL_WORK_STATUSES } from "./api/small-works.types"
import { isPlannedDateWithinTenYears } from "./lib/smallWorksFormRules"

const plannedDateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "validation.dateInvalid" })
  .refine(isPlannedDateWithinTenYears, {
    message: "validation.plannedDateOutOfRange",
  })

function refineEndOnOrAfterStart(
  data: {
    startDate?: string
    endDate?: string
  },
  ctx: z.RefinementCtx,
) {
  if (!data.startDate || !data.endDate) return
  if (data.endDate < data.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "smallWorks.validation.endBeforeStart",
      path: ["endDate"],
    })
  }
}

export const smallWorkCreateSchema = z
  .object({
    villaId: z.string().uuid(),
    contractorId: z.string().uuid({ message: "validation.required" }),
    startDate: plannedDateField,
    endDate: plannedDateField,
    description: z.string().trim().min(1).max(500),
    status: z.enum(SMALL_WORK_STATUSES).optional(),
  })
  .superRefine(refineEndOnOrAfterStart)

export const smallWorkEditSchema = z
  .object({
    contractorId: z.string().uuid().optional(),
    startDate: plannedDateField.optional(),
    endDate: plannedDateField.optional(),
    description: z.string().trim().min(1).max(500).optional(),
    status: z.enum(SMALL_WORK_STATUSES).optional(),
  })
  .superRefine(refineEndOnOrAfterStart)

export type SmallWorkCreateFormValues = z.infer<typeof smallWorkCreateSchema>
export type SmallWorkEditFormValues = z.infer<typeof smallWorkEditSchema>

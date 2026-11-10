import { z } from "zod"
import { PRIORITIES, WORK_STATUSES } from "./api/open-works.types"
import { statusAgreesWithProgress } from "./lib/openWorksFormRules"

const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "validation.dateInvalid" })
  .optional()
  .or(z.literal(""))

const baseFields = {
  elecPhaseId: z.string().uuid({ message: "validation.required" }),
  status: z.enum(WORK_STATUSES),
  priority: z.enum(PRIORITIES),
  progress: z.number().int().min(0).max(100),
  contractorId: z.string().uuid().optional().or(z.literal("")),
  startDate: dateField,
  endDate: dateField,
}

type SharedWorkFields = {
  status: typeof WORK_STATUSES[number]
  priority: typeof PRIORITIES[number]
  progress: number
  contractorId?: string
  startDate?: string
  endDate?: string
}

function refineWorkForm(values: SharedWorkFields, ctx: z.RefinementCtx) {
  const start = values.startDate?.trim()
  const end = values.endDate?.trim()
  if (start && end && end < start) {
    ctx.addIssue({
      code: "custom",
      message: "validation.dateOrder",
      path: ["endDate"],
    })
  }
  if (!statusAgreesWithProgress(values.status, values.progress)) {
    ctx.addIssue({
      code: "custom",
      message: "openWorks.validation.statusProgress",
      path: ["progress"],
    })
  }
}

function withDateOrder<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((values, ctx) => {
    refineWorkForm(values as SharedWorkFields, ctx)
  })
}

export const openWorkCreateSchema = withDateOrder(
  z.object({
    villaId: z.string().uuid(),
    ...baseFields,
  }),
)

export const openWorkEditSchema = withDateOrder(z.object(baseFields))

export type OpenWorkCreateFormValues = z.infer<typeof openWorkCreateSchema>
export type OpenWorkEditFormValues = z.infer<typeof openWorkEditSchema>

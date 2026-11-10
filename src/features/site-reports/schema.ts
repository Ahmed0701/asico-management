import { z } from "zod"
import { SITE_REPORT_TYPES } from "./api/site-reports.types"
import {
  isValidSiteReportRating,
  isValidVisitDateYmd,
} from "./lib/siteReportsFormRules"

const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "validation.dateInvalid" })
  .refine(isValidVisitDateYmd, { message: "validation.reportDateFuture" })

const optionalRecommendations = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().max(5000).nullable().optional(),
)

export const siteReportCreateSchema = z.object({
  villaId: z.string().uuid(),
  title: z.string().trim().min(1).max(150),
  visitDate: dateField,
  inspector: z.string().trim().min(1).max(100),
  type: z.enum(SITE_REPORT_TYPES),
  rating: z
    .number()
    .refine(isValidSiteReportRating, { message: "validation.ratingInvalid" }),
  findings: z.string().trim().min(1).max(5000),
  recommendations: optionalRecommendations,
})

export const siteReportEditSchema = z.object({
  title: z.string().trim().min(1).max(150).optional(),
  visitDate: dateField.optional(),
  inspector: z.string().trim().min(1).max(100).optional(),
  type: z.enum(SITE_REPORT_TYPES).optional(),
  rating: z
    .number()
    .refine(isValidSiteReportRating, { message: "validation.ratingInvalid" })
    .optional(),
  findings: z.string().trim().min(1).max(5000).optional(),
  recommendations: optionalRecommendations,
})

export type SiteReportCreateFormValues = z.infer<typeof siteReportCreateSchema>
export type SiteReportEditFormValues = z.infer<typeof siteReportEditSchema>

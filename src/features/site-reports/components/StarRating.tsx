import { useTranslation } from "react-i18next"
import { MIN_RATING, MAX_RATING } from "../api/site-reports.types"

export default function StarRating({ value }: { value: number }) {
  const { t } = useTranslation()
  const clamped = Math.min(MAX_RATING, Math.max(MIN_RATING, value))
  return (
    <span
      className="text-amber-500 tabular-nums"
      aria-label={t("siteReports.ratingAria", {
        value: clamped,
        max: MAX_RATING,
      })}
    >
      {"★".repeat(clamped)}
      {"☆".repeat(MAX_RATING - clamped)}
    </span>
  )
}

import { useTranslation } from "react-i18next"
import { cn } from "@/shared/lib/cn"
import { MAX_RATING, MIN_RATING } from "../api/site-reports.types"

const STARS = Array.from(
  { length: MAX_RATING - MIN_RATING + 1 },
  (_, i) => MIN_RATING + i,
)

export default function StarRatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const safe = Math.min(MAX_RATING, Math.max(MIN_RATING, value || MIN_RATING))

  return (
    <div
      role="radiogroup"
      aria-label={t("siteReports.fieldRating")}
      className="flex items-center gap-0.5"
    >
      {STARS.map((star) => {
        const filled = star <= safe
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            role="radio"
            aria-checked={safe === star}
            aria-label={t("siteReports.filters.ratingValue", { count: star })}
            className={cn(
              "rounded-sm px-0.5 text-2xl leading-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              filled ? "text-amber-500" : "text-muted-foreground/35",
              !disabled && "hover:text-amber-400",
              disabled && "cursor-not-allowed opacity-50",
            )}
            onClick={() => onChange(star)}
          >
            {filled ? "★" : "☆"}
          </button>
        )
      })}
    </div>
  )
}

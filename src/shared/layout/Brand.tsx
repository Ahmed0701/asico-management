import { useTranslation } from "react-i18next"

type Props = {
  compact?: boolean
  withTagline?: boolean
}

export default function Brand({ compact = false, withTagline = false }: Props) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm ring-1 ring-black/5">
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 20V11l9-7 9 7v9" />
          <path
            d="M9 20v-6h6v6"
            className="text-accent"
            stroke="var(--accent)"
          />
        </svg>
      </span>
      {!compact && (
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="text-[17px] font-semibold tracking-tight">
            {t("app.name")}
          </span>
          {withTagline && (
            <span className="truncate text-[11px] text-muted-foreground">
              {t("app.tagline")}
            </span>
          )}
        </span>
      )}
    </div>
  )
}

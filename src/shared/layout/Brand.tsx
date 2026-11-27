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
        {/* A lightning bolt: Elecico does electrical works. */}
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          aria-hidden
          strokeLinejoin="round"
        >
          <path
            d="M13.2 2.5 4.6 13.8h6.2l-1.3 7.7 8.9-11.7h-6.3l1.1-7.3Z"
            fill="var(--accent)"
            stroke="var(--accent)"
            strokeWidth="1.2"
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

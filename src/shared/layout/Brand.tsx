import { useTranslation } from "react-i18next"

export default function Brand({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
        <svg
          width="18"
          height="18"
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
        <span className="text-lg font-semibold tracking-tight">
          {t("app.name")}
        </span>
      )}
    </div>
  )
}

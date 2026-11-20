import { useTranslation } from "react-i18next"
import { cn } from "@/shared/lib/cn"
import type { MewState } from "../api"

const STATE_STYLE: Record<MewState, string> = {
  NOT_SUBMITTED: "bg-muted text-muted-foreground",
  RUNNING: "bg-progress-soft text-progress",
  APPROVED: "bg-success-soft text-success",
}

// One MEW approval as a small labelled pill (the states are changed on the MEW follow-up page).
export default function MewApprovalPill({
  label,
  state,
}: {
  label: string
  state: MewState
}) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        STATE_STYLE[state],
      )}
    >
      <span className="opacity-70">{label}</span>
      {t(`mewFollowUp.states.${state}`)}
    </span>
  )
}

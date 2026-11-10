import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { cn } from "@/shared/lib/cn"
import { MEW_STATES, type MewState } from "../api"

// The colour of each state: approved is green, running is under way, not submitted is grey.
const STATE_TONE: Record<MewState, string> = {
  NOT_SUBMITTED: "text-muted-foreground",
  RUNNING: "text-progress",
  APPROVED: "text-success",
}

// A villa's MEW state (AC or electricity): a dropdown for someone who may change it, plain text otherwise.
export default function MewStateSelect({
  value,
  label,
  canEdit,
  disabled,
  onChange,
}: {
  value: MewState
  label: string
  canEdit: boolean
  disabled?: boolean
  onChange: (next: MewState) => void
}) {
  const { t } = useTranslation()

  if (!canEdit) {
    return (
      <span className={cn("text-sm font-medium", STATE_TONE[value])}>
        {t(`mewFollowUp.states.${value}`)}
      </span>
    )
  }

  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        if (next !== value) onChange(next as MewState)
      }}
    >
      <SelectTrigger
        aria-label={label}
        className={cn("h-8 w-36 text-xs font-medium", STATE_TONE[value])}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MEW_STATES.map((state) => (
          <SelectItem key={state} value={state}>
            {t(`mewFollowUp.states.${state}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

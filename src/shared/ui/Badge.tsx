import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "../lib/cn"

export type StatusKey = "OPEN" | "IN_PROGRESS" | "CLOSED"

const tone: Record<StatusKey, string> = {
  OPEN: "bg-open-soft text-open",
  IN_PROGRESS: "bg-progress-soft text-progress",
  CLOSED: "bg-closed-soft text-closed",
}
export const statusDot: Record<StatusKey, string> = {
  OPEN: "bg-open",
  IN_PROGRESS: "bg-progress",
  CLOSED: "bg-closed",
}

export function StatusBadge({ status }: { status: StatusKey }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium",
        tone[status],
      )}
    >
      <span className={cn("size-1.5 rounded-full", statusDot[status])} />
      {t(`status.${status}`)}
    </span>
  )
}

export function Badge({
  children,
  tone: t = "neutral",
}: {
  children: ReactNode
  tone?: "neutral" | "danger" | "success" | "warn" | "info"
}) {
  const map = {
    neutral: "bg-muted text-muted-foreground",
    danger: "bg-danger-soft text-danger",
    success: "bg-success-soft text-success",
    warn: "bg-progress-soft text-progress",
    info: "bg-open-soft text-open",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium",
        map[t],
      )}
    >
      {children}
    </span>
  )
}

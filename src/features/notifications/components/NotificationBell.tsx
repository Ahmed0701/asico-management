import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/shared/lib/cn"
import { useMeQuery } from "@/features/auth/api"
import { IconButton } from "@/shared/ui/Button"
import { Switch } from "@/shared/ui/switch"
import { Label } from "@/shared/ui/label"
import { useNotificationsUnreadCountQuery } from "../api"
import NotificationsPanel from "./NotificationsPanel"

function formatUnreadBadge(count: number): string | null {
  if (count <= 0) return null
  if (count > 99) return "99+"
  return String(count)
}

export default function NotificationBell() {
  const { t } = useTranslation()
  const { data: user } = useMeQuery()
  const [open, setOpen] = useState(false)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const enabled = !!user
  const { data: unreadCount = 0 } = useNotificationsUnreadCountQuery(enabled)
  const badge = formatUnreadBadge(unreadCount)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  if (!enabled) return null

  return (
    <div ref={ref} className="relative">
      <IconButton
        icon="bell"
        label={t("notifications.bellLabel")}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative"
      />
      {badge && (
        <span
          className={cn(
            "pointer-events-none absolute top-0.5 min-w-[1.1rem] rounded-full bg-danger px-1 py-px text-center text-[10px] font-semibold leading-none text-white",
            "end-0.5",
          )}
          aria-hidden
        >
          {badge}
        </span>
      )}
      {open && (
        <div
          className={cn(
            "absolute top-full z-40 mt-2 rounded-lg border border-border bg-card shadow-xl [animation:pop-in_.15s_ease-out]",
            "end-0 w-max",
          )}
        >
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Switch
              id="notifications-unread-only"
              checked={unreadOnly}
              onCheckedChange={setUnreadOnly}
            />
            <Label
              htmlFor="notifications-unread-only"
              className="text-xs font-normal text-muted-foreground"
            >
              {t("notifications.unreadOnly")}
            </Label>
          </div>
          <NotificationsPanel
            unreadOnly={unreadOnly}
            panelOpen={open}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  )
}

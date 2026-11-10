import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { cn } from "@/shared/lib/cn"
import { formatCalendarDateUtc } from "@/shared/lib/formatCalendarDateUtc"
import Button from "@/shared/ui/Button"
import { useUiStore } from "@/shared/lib/store"
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsPanelQuery,
} from "../api"
import { pickLocalizedText } from "../lib/notificationText"
import type { Notification } from "../api/notifications.types"

function formatEndDate(ymd: string): string {
  return formatCalendarDateUtc(`${ymd}T00:00:00.000Z`)
}

export default function NotificationsPanel({
  unreadOnly,
  panelOpen,
  onClose,
}: {
  unreadOnly: boolean
  panelOpen: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { lang } = useUiStore()
  const query = useNotificationsPanelQuery(unreadOnly, panelOpen)
  const markRead = useMarkNotificationReadMutation()
  const markAll = useMarkAllNotificationsReadMutation()

  const rows = query.data?.pages.flatMap((p) => p.data) ?? []

  const openNotification = async (item: Notification) => {
    if (!item.read) {
      try {
        await markRead.mutateAsync(item.id)
      } catch {
        /* keep navigation even if mark read fails transiently */
      }
    }
    onClose()
    navigate(
      item.entity.type === "OPEN_WORK"
        ? `/villas/${item.entity.villaId}?tab=openWorks`
        : `/villas/${item.entity.villaId}?tab=smallWorks&highlightSmallWork=${encodeURIComponent(item.entity.id)}`,
    )
  }

  return (
    <div className="flex max-h-[min(32rem,70vh)] w-[min(24rem,calc(100vw-2rem))] flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <p className="text-sm font-semibold">{t("notifications.panelTitle")}</p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={markAll.isPending || !rows.some((r) => !r.read)}
          onClick={() => void markAll.mutateAsync()}
        >
          {t("notifications.markAllRead")}
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1">
        {query.isLoading && !rows.length ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            {t("common.loading")}
          </p>
        ) : rows.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            {t("notifications.empty")}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {rows.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={cn(
                    "w-full rounded-md px-3 py-2.5 text-start transition hover:bg-muted",
                    !item.read && "bg-accent/10",
                  )}
                  onClick={() => void openNotification(item)}
                >
                  <p className="text-sm font-medium" dir="auto">
                    {pickLocalizedText(item.title, lang)}
                  </p>
                  <p
                    className="mt-0.5 text-xs text-muted-foreground"
                    dir="auto"
                  >
                    {pickLocalizedText(item.body, lang)}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground tabular-nums">
                    {formatEndDate(item.data.endDate)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
        {query.hasNextPage && (
          <div className="border-t border-border p-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="w-full"
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {query.isFetchingNextPage
                ? t("common.loading")
                : t("notifications.loadMore")}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

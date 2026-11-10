import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import type {
  Notification,
  NotificationsListParams,
  NotificationsListResponse,
} from "./notifications.types"

export function buildNotificationsListQueryParams(
  params: NotificationsListParams,
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {
    page: params.page,
    limit: params.limit,
  }
  if (params.unread === true) out.unread = true
  if (params.unread === false) out.unread = false
  return out
}

export async function listNotifications(
  params: NotificationsListParams,
  signal?: AbortSignal,
): Promise<NotificationsListResponse> {
  const res = await api.get<NotificationsListResponse>("/notifications", {
    params: buildNotificationsListQueryParams(params),
    signal,
  })
  return { data: res.data.data, meta: res.data.meta }
}

export async function markNotificationRead(id: string): Promise<Notification> {
  return unwrap(
    api.post<ApiSuccess<Notification>>(`/notifications/${id}/read`, {}),
  )
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  return unwrap(
    api.post<ApiSuccess<{ updated: number }>>("/notifications/read-all", {}),
  )
}

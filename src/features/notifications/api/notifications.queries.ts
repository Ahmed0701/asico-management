import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toApiError } from "@/shared/api/errors"
import * as api from "./notifications.api"
import type { NotificationsListParams } from "./notifications.types"

export const NOTIFICATIONS_POLL_MS = 60_000
const UNREAD_POLL_LIMIT = 1
const PANEL_PAGE_SIZE = 20

export const notificationsKeys = {
  all: ["notifications"] as const,
  unreadCount: () => [...notificationsKeys.all, "unread-count"] as const,
  list: (unreadOnly: boolean) =>
    [...notificationsKeys.all, "list", { unreadOnly }] as const,
}

function shouldRetryNotifications(count: number, err: unknown): boolean {
  const parsed = toApiError(err)
  if (parsed.status === 401 || parsed.status === 403) return false
  if (parsed.status >= 500 || parsed.code === "NETWORK_ERROR") return count < 2
  return false
}

export function useNotificationsUnreadCountQuery(enabled: boolean) {
  return useQuery({
    queryKey: notificationsKeys.unreadCount(),
    queryFn: ({ signal }) =>
      api
        .listNotifications(
          { page: 1, limit: UNREAD_POLL_LIMIT, unread: true },
          signal,
        )
        .then((res) => res.meta.unreadCount),
    enabled,
    staleTime: NOTIFICATIONS_POLL_MS,
    refetchInterval: NOTIFICATIONS_POLL_MS,
    refetchOnWindowFocus: true,
    retry: shouldRetryNotifications,
  })
}

export function useNotificationsPanelQuery(
  unreadOnly: boolean,
  panelOpen: boolean,
) {
  return useInfiniteQuery({
    queryKey: notificationsKeys.list(unreadOnly),
    queryFn: ({ pageParam, signal }) =>
      api.listNotifications(
        {
          page: pageParam,
          limit: PANEL_PAGE_SIZE,
          unread: unreadOnly ? true : undefined,
        },
        signal,
      ),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: panelOpen,
    retry: shouldRetryNotifications,
  })
}

export function useMarkNotificationReadMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    retry: shouldRetryNotifications,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationsKeys.all })
    },
  })
}

export function useMarkAllNotificationsReadMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    retry: shouldRetryNotifications,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationsKeys.all })
    },
  })
}

export type { NotificationsListParams }

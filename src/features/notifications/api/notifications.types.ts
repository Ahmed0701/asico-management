import type { PaginatedMeta } from "@/shared/api/types"

export const NOTIFICATION_KINDS = [
  "SMALL_WORK_DUE_SOON",
  "SMALL_WORK_OVERDUE",
  "OPEN_WORK_OVERDUE",
] as const
export type NotificationKind = typeof NOTIFICATION_KINDS[number]

export type LocalizedText = {
  en: string
  ar: string
}

export type NotificationEntity = {
  type: "SMALL_WORK" | "OPEN_WORK"
  id: string
  villaId: string
}

export type Notification = {
  id: string
  kind: NotificationKind
  title: LocalizedText
  body: LocalizedText
  entity: NotificationEntity
  data: {
    villaNumber: string
    description: string
    contractorName: string
    endDate: string
  }
  read: boolean
  readAt: string | null
  createdAt: string
}

export type NotificationsListParams = {
  page: number
  limit: number
  unread?: boolean
}

export type NotificationsListMeta = PaginatedMeta & {
  unreadCount: number
}

export type NotificationsListResponse = {
  data: Notification[]
  meta: NotificationsListMeta
}

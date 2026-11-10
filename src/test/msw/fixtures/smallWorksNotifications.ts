import type { Notification } from "@/features/notifications/api/notifications.types"
import type { SmallWork } from "@/features/small-works/api/small-works.types"

export const mockContractor = {
  id: "e3e2d2c2-3333-4c4d-8e5f-607182930415",
  name: "Nile Contracting",
}

export const mockVilla = {
  id: "7c2e9b10-4a5d-4e3f-8a1b-9d6c0e2f4a58",
  villaNumber: "P-014",
  location: "New Cairo - Block A - Plot 3",
}

export const mockSmallWorks: SmallWork[] = [
  {
    id: "5f0c7a52-1d3b-4a8e-9b6c-2e4d8f10a3b7",
    villa: mockVilla,
    contractor: mockContractor,
    startDate: "2026-02-01",
    endDate: "2026-02-10",
    deadlineAt: "2026-02-10T21:00:00.000Z",
    overdue: true,
    dueSoon: false,
    description: "Repair the garden wall",
    status: "PENDING",
    createdBy: { id: "u1", name: "Test User" },
    version: 1,
    createdAt: "2026-02-01T08:00:00.000Z",
    updatedAt: "2026-02-01T08:00:00.000Z",
  },
  {
    id: "6a1d8b63-2e4c-5b9f-0c7d-3f5e6a21b4c8",
    villa: mockVilla,
    contractor: mockContractor,
    startDate: "2026-03-01",
    endDate: "2026-03-20",
    deadlineAt: "2026-03-20T21:00:00.000Z",
    overdue: false,
    dueSoon: true,
    description: "Paint boundary fence",
    status: "PENDING",
    createdBy: { id: "u1", name: "Test User" },
    version: 1,
    createdAt: "2026-03-01T08:00:00.000Z",
    updatedAt: "2026-03-01T08:00:00.000Z",
  },
  {
    id: "7b2e9c74-3f5d-6c0a-1d8e-4a6f7a32c5d9",
    villa: mockVilla,
    contractor: mockContractor,
    startDate: "2026-01-05",
    endDate: "2026-01-08",
    deadlineAt: "2026-01-08T21:00:00.000Z",
    overdue: false,
    dueSoon: false,
    description: "Completed patch work",
    status: "DONE",
    createdBy: null,
    version: 2,
    createdAt: "2026-01-05T08:00:00.000Z",
    updatedAt: "2026-01-09T08:00:00.000Z",
  },
]

let notifications: Notification[] = [
  {
    id: "n-overdue-1",
    kind: "SMALL_WORK_OVERDUE",
    title: {
      en: "Small work overdue",
      ar: "عمل صغير متأخر",
    },
    body: {
      en: "P-014: Repair the garden wall",
      ar: "P-014: إصلاح سور الحديقة",
    },
    entity: {
      type: "SMALL_WORK",
      id: mockSmallWorks[0].id,
      villaId: mockVilla.id,
    },
    data: {
      villaNumber: mockVilla.villaNumber,
      description: mockSmallWorks[0].description,
      contractorName: mockContractor.name,
      endDate: mockSmallWorks[0].endDate,
    },
    read: false,
    readAt: null,
    createdAt: "2026-02-11T09:00:00.000Z",
  },
  {
    id: "n-due-soon-1",
    kind: "SMALL_WORK_DUE_SOON",
    title: {
      en: "Small work due soon",
      ar: "عمل صغير على وشك التأخر",
    },
    body: {
      en: "P-014: Paint boundary fence",
      ar: "P-014: طلاء السور",
    },
    entity: {
      type: "SMALL_WORK",
      id: mockSmallWorks[1].id,
      villaId: mockVilla.id,
    },
    data: {
      villaNumber: mockVilla.villaNumber,
      description: mockSmallWorks[1].description,
      contractorName: mockContractor.name,
      endDate: mockSmallWorks[1].endDate,
    },
    read: true,
    readAt: "2026-03-01T10:00:00.000Z",
    createdAt: "2026-03-01T09:00:00.000Z",
  },
]

export function listMockNotifications(unreadOnly: boolean) {
  const sorted = [...notifications].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  )
  const data = unreadOnly ? sorted.filter((n) => !n.read) : sorted
  const unreadCount = notifications.filter((n) => !n.read).length
  return { data, unreadCount }
}

export function markMockNotificationRead(id: string): Notification | undefined {
  const item = notifications.find((n) => n.id === id)
  if (!item) return undefined
  if (!item.read) {
    item.read = true
    item.readAt = new Date().toISOString()
  }
  return item
}

export function markAllMockNotificationsRead(): number {
  let updated = 0
  for (const n of notifications) {
    if (!n.read) {
      n.read = true
      n.readAt = new Date().toISOString()
      updated += 1
    }
  }
  return updated
}

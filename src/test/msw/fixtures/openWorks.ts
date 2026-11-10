import type { OpenWork } from "@/features/open-works/api/open-works.types"
import { mockContractor, mockVilla } from "./smallWorksNotifications"

export const mockOpenWorks: OpenWork[] = [
  {
    id: "ow-1",
    villa: mockVilla,
    elecPhase: { id: "ep-1", name: "First fix" },
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    progress: 40,
    contractor: mockContractor,
    startDate: "2026-02-01",
    endDate: "2026-03-01",
    overdue: false,
    overdueDays: 0,
    createdBy: { id: "u1", name: "Test User" },
    version: 1,
    createdAt: "2026-02-01T08:00:00.000Z",
    updatedAt: "2026-02-01T08:00:00.000Z",
  },
]

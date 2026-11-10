import type { DailyReport } from "@/features/daily-reports/api/daily-reports.types"
import { mockContractor } from "./smallWorksNotifications"

export const mockDailyReports: DailyReport[] = [
  {
    id: "dr-1",
    reportDate: "2026-03-01",
    weather: "SUNNY",
    workersCount: 12,
    notes: "Cable trays installed",
    contractor: mockContractor,
    preparedBy: { id: "ee-1", name: "Eng. Samir" },
    createdBy: { id: "u1", name: "Test User" },
    version: 1,
    createdAt: "2026-03-01T10:00:00.000Z",
    updatedAt: "2026-03-01T10:00:00.000Z",
  },
]

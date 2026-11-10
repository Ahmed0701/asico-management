import { describe, expect, it } from "vitest"
import { mapDashboardSummary } from "./dashboard.api"
import { dashboardHasAnySection } from "./dashboard.types"

describe("mapDashboardSummary", () => {
  it("maps a full admin summary", () => {
    const mapped = mapDashboardSummary({
      villas: { total: 120 },
      progress: {
        average: 42.5,
        notStarted: 10,
        inProgress: 90,
        done: 20,
      },
      overdue: { count: 7 },
      upcoming: { count: 12 },
      mewFollowUp: { count: 5 },
      byArea: [
        {
          areaId: "a1",
          area: "New Cairo",
          city: "Cairo",
          total: 80,
        },
      ],
      topContractors: [{ id: "c1", name: "Nile", total: 14 }],
      openWorks: {
        total: 68,
        delayed: 6,
        byStatus: {
          NOT_STARTED: 3,
          IN_PROGRESS: 41,
          DELAYED: 6,
          DONE: 18,
        },
        overdue: 4,
        overdueList: [],
      },
      dailyReports: { today: 31, last7Days: 188 },
      smallWorks: {
        total: 42,
        pending: 9,
        dueSoon: 2,
        overdue: 1,
        urgent: [],
      },
      siteReports: { count: 64, averageRating: 4.2 },
      labour: { today: 412, last7Days: 2810 },
      totalLabour: { total: 125_400 },
      delayedSmallWorks: { overdue: 3, dueSoon: 5 },
      generatedAt: "2026-03-01T09:30:00.000Z",
    })

    expect(mapped.villas?.total).toBe(120)
    expect(mapped.progress?.done).toBe(20)
    expect(mapped.openWorks?.total).toBe(68)
    expect(mapped.openWorks?.delayed).toBe(6)
    expect(mapped.openWorks?.byStatus.DELAYED).toBe(6)
    expect(mapped.smallWorks?.total).toBe(42)
    expect(mapped.siteReports?.averageRating).toBe(4.2)
    expect(mapped.smallWorks?.overdue).toBe(1)
    expect(mapped.smallWorks?.dueSoon).toBe(2)
    expect(mapped.totalLabour?.total).toBe(125_400)
    expect(mapped.delayedSmallWorks?.overdue).toBe(3)
    expect(mapped.delayedSmallWorks?.dueSoon).toBe(5)
  })

  it("keeps null sections when permissions omit cards", () => {
    const mapped = mapDashboardSummary({
      villas: { total: 120 },
      progress: {
        average: 42.5,
        notStarted: 10,
        inProgress: 90,
        done: 20,
      },
      overdue: { count: 7 },
      upcoming: { count: 12 },
      mewFollowUp: { count: 5 },
      byArea: [],
      topContractors: null,
      openWorks: null,
      dailyReports: { today: 31, last7Days: 188 },
      smallWorks: null,
      siteReports: null,
      labour: null,
      generatedAt: "2026-03-01T09:30:00.000Z",
    })

    expect(mapped.topContractors).toBeNull()
    expect(mapped.openWorks).toBeNull()
    expect(mapped.byArea).toEqual([])
  })

  it("does not throw when every card is null", () => {
    const mapped = mapDashboardSummary({
      villas: null,
      progress: null,
      overdue: null,
      upcoming: null,
      mewFollowUp: null,
      mewInspection: null,
      maintenance: null,
      byArea: null,
      topContractors: null,
      openWorks: null,
      dailyReports: null,
      smallWorks: null,
      siteReports: null,
      labour: null,
      generatedAt: "2026-03-01T09:30:00.000Z",
    })

    expect(mapped.villas).toBeNull()
    expect(mapped.generatedAt).toBe("2026-03-01T09:30:00.000Z")
  })

  it("treats totalLabour and delayedSmallWorks as visible sections", () => {
    const empty = mapDashboardSummary({
      villas: null,
      progress: null,
      overdue: null,
      upcoming: null,
      mewFollowUp: null,
      mewInspection: null,
      maintenance: null,
      byArea: null,
      topContractors: null,
      openWorks: null,
      dailyReports: null,
      smallWorks: null,
      siteReports: null,
      labour: null,
      totalLabour: { total: 100 },
      delayedSmallWorks: { overdue: 0, dueSoon: 0 },
      generatedAt: "2026-03-01T09:30:00.000Z",
    })
    expect(dashboardHasAnySection(empty)).toBe(true)
  })
})

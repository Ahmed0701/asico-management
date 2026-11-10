import { QueryClient } from "@tanstack/react-query"
import { describe, expect, it } from "vitest"
import { dashboardKeys } from "@/features/dashboard/api/dashboard.queries"
import { villasKeys } from "../api/villas.queries"
import type { VillaDetail } from "../api/villas.types"
import { mergePhaseUpdateIntoDetail } from "./villaDetailCache"
import {
  invalidateVillaListsAndDashboard,
  isVillaListQuery,
  patchVillaDetailFromPhaseUpdate,
} from "./villaQueryCache"

const baseDetail = (): VillaDetail => ({
  id: "v1",
  villaNumber: "V-1",
  ownerName: null,
  villaType: null,
  area: "A",
  areaId: "a1",
  block: "B",
  plot: "1",
  location: "A . B . 1",
  startDate: null,
  targetDate: null,
  budgetMinor: null,
  currency: null,
  progress: 10,
  mewFollowUp: null,
  mewInspection: null,
  mewInspectionPassed: null,
  mewAcState: "NOT_SUBMITTED",
  mewElecState: "NOT_SUBMITTED",
  mewInspectionDate: null,
  version: 2,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  civilEngineer: { id: "c1", name: "C", phone: "+1" },
  electricalEngineer: null,
  contractor: null,
  createdBy: { id: "u1", name: "Admin" },
  phaseCount: 1,
  phases: [
    {
      elecPhaseId: "p1",
      name: "Phase 1",
      order: 1,
      progress: 10,
      state: "IN_PROGRESS",
      version: 5,
    },
  ],
})

describe("villaQueryCache", () => {
  it("identifies villa list queries", () => {
    expect(
      isVillaListQuery({
        queryKey: villasKeys.list({ page: 1, limit: 20 }),
      } as never),
    ).toBe(true)
    expect(
      isVillaListQuery({ queryKey: villasKeys.detail("v1") } as never),
    ).toBe(false)
  })

  it("patches detail cache after phase update", () => {
    const qc = new QueryClient()
    qc.setQueryData(villasKeys.detail("v1"), baseDetail())
    patchVillaDetailFromPhaseUpdate(qc, "v1", {
      elecPhaseId: "p1",
      name: "Phase 1",
      order: 1,
      progress: 55,
      state: "IN_PROGRESS",
      version: 6,
      villaProgress: 55,
      phaseCount: 1,
    })
    const cached = qc.getQueryData<VillaDetail>(villasKeys.detail("v1"))
    expect(cached?.progress).toBe(55)
    expect(cached?.phases[0]?.progress).toBe(55)
    expect(cached?.phases[0]?.version).toBe(6)
    expect(
      mergePhaseUpdateIntoDetail(baseDetail(), {
        elecPhaseId: "p1",
        name: "Phase 1",
        order: 1,
        progress: 55,
        state: "IN_PROGRESS",
        version: 6,
        villaProgress: 55,
        phaseCount: 1,
      }),
    ).toEqual(cached)
  })

  it("invalidates list and dashboard queries but not detail", () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const detailKey = villasKeys.detail("v1")
    const listKey = villasKeys.list({ page: 1, limit: 20 })
    const dashKey = dashboardKeys.summary()
    qc.setQueryData(detailKey, baseDetail())
    qc.setQueryData(listKey, {
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
    })
    qc.setQueryData(dashKey, { villas: { total: 1 } })

    invalidateVillaListsAndDashboard(qc)

    expect(qc.getQueryState(detailKey)?.isInvalidated).not.toBe(true)
    expect(qc.getQueryState(listKey)?.isInvalidated).toBe(true)
    expect(qc.getQueryState(dashKey)?.isInvalidated).toBe(true)
  })
})

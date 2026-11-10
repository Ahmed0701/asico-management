import { describe, expect, it } from "vitest"
import {
  mergeListItemIntoDetail,
  mergePhaseUpdateIntoDetail,
} from "./villaDetailCache"
import type { VillaDetail, VillaListItem } from "../api/villas.types"

const baseDetail = (): VillaDetail => ({
  id: "v1",
  villaNumber: "V-1",
  ownerName: "Owner",
  villaType: null,
  area: "Area",
  areaId: "a1",
  block: "B",
  plot: "1",
  location: "Area . B . 1",
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
  civilEngineer: { id: "c1", name: "Civil", phone: "+1" },
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

describe("villaDetailCache", () => {
  it("merges list item inspection fields into detail", () => {
    const item: VillaListItem = {
      ...baseDetail(),
      progress: 50,
      version: 3,
      mewFollowUp: {
        at: "2026-03-01T09:00:00.000Z",
        by: { id: "u2", name: "Inspector" },
      },
    }
    const merged = mergeListItemIntoDetail(baseDetail(), item)
    expect(merged.progress).toBe(50)
    expect(merged.version).toBe(3)
    expect(merged.mewFollowUp?.by?.name).toBe("Inspector")
  })

  it("merges phase progress update into detail", () => {
    const update = {
      elecPhaseId: "p1",
      name: "Phase 1",
      order: 1,
      progress: 100,
      state: "DONE" as const,
      version: 6,
      villaProgress: 100,
      phaseCount: 1,
    }
    const merged = mergePhaseUpdateIntoDetail(baseDetail(), update)
    expect(merged.progress).toBe(100)
    expect(merged.phases[0]?.progress).toBe(100)
    expect(merged.phases[0]?.version).toBe(6)
  })
})

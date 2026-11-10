import { QueryClient } from "@tanstack/react-query"
import { describe, expect, it } from "vitest"
import { invalidateDailyLabourAfterWrite } from "@/features/daily-labour/lib/dailyLabourQueryCache"
import { invalidateDailyReportsAfterWrite } from "@/features/daily-reports/lib/dailyReportsQueryCache"
import { invalidateElecPhasesAfterWrite } from "@/features/elec-phases/lib/elecPhasesQueryCache"
import { invalidateOpenWorksAfterWrite } from "@/features/open-works/lib/openWorksQueryCache"
import { invalidateSmallWorksAfterWrite } from "@/features/small-works/lib/smallWorksQueryCache"
import {
  invalidateAfterVillaPhaseProgress,
  invalidateVillaListsAndDashboard,
} from "@/features/villas/lib/villaQueryCache"
import { contractorsKeys } from "../api/contractors.queries"

function seedContractorQueries(qc: QueryClient) {
  const listKey = contractorsKeys.list({ page: 1, limit: 20 })
  const summaryKey = contractorsKeys.summary("c1", { page: 1, limit: 20 })
  const detailKey = contractorsKeys.detail("c1")
  qc.setQueryData(listKey, { data: [], meta: {} })
  qc.setQueryData(summaryKey, { data: {}, meta: {} })
  qc.setQueryData(detailKey, { id: "c1" })
  return { listKey, summaryKey, detailKey }
}

function expectSummariesInvalidated(
  qc: QueryClient,
  listKey: readonly unknown[],
  summaryKey: readonly unknown[],
  detailKey: readonly unknown[],
) {
  expect(qc.getQueryState(listKey)?.isInvalidated).toBe(true)
  expect(qc.getQueryState(summaryKey)?.isInvalidated).toBe(true)
  expect(qc.getQueryState(detailKey)?.isInvalidated).toBeFalsy()
}

describe("contractor summary invalidation after writes", () => {
  it.each([
    [
      "open works write",
      (qc: QueryClient) => invalidateOpenWorksAfterWrite(qc),
    ],
    [
      "small works write",
      (qc: QueryClient) => invalidateSmallWorksAfterWrite(qc),
    ],
    [
      "daily reports write",
      (qc: QueryClient) => invalidateDailyReportsAfterWrite(qc),
    ],
    [
      "daily labour write",
      (qc: QueryClient) => invalidateDailyLabourAfterWrite(qc),
    ],
    [
      "elec phases write",
      (qc: QueryClient) => invalidateElecPhasesAfterWrite(qc),
    ],
    ["villas write", (qc: QueryClient) => invalidateVillaListsAndDashboard(qc)],
    [
      "villas import",
      (qc: QueryClient) => invalidateVillaListsAndDashboard(qc),
    ],
    [
      "open works import",
      (qc: QueryClient) => invalidateOpenWorksAfterWrite(qc),
    ],
    [
      "daily reports import",
      (qc: QueryClient) => invalidateDailyReportsAfterWrite(qc),
    ],
    [
      "small works import",
      (qc: QueryClient) => invalidateSmallWorksAfterWrite(qc),
    ],
    [
      "daily labour import",
      (qc: QueryClient) => invalidateDailyLabourAfterWrite(qc),
    ],
    [
      "villa phase progress",
      (qc: QueryClient) =>
        invalidateAfterVillaPhaseProgress(
          qc,
          "22222222-2222-4222-8222-222222222222",
        ),
    ],
  ])("%s invalidates contractor list and summary", (_label, invalidate) => {
    const qc = new QueryClient()
    const keys = seedContractorQueries(qc)
    invalidate(qc)
    expectSummariesInvalidated(
      qc,
      keys.listKey,
      keys.summaryKey,
      keys.detailKey,
    )
  })
})

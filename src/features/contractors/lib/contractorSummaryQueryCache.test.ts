import { QueryClient } from "@tanstack/react-query"
import { describe, expect, it } from "vitest"
import { contractorsKeys } from "../api/contractors.queries"
import { invalidateContractorSummariesAndLists } from "./contractorSummaryQueryCache"

describe("invalidateContractorSummariesAndLists", () => {
  it("invalidates contractor list and summary queries only", () => {
    const qc = new QueryClient()
    const listKey = contractorsKeys.list({ page: 1, limit: 20 })
    const summaryKey = contractorsKeys.summary("c1", { page: 1, limit: 20 })
    const detailKey = contractorsKeys.detail("c1")
    qc.setQueryData(listKey, { data: [], meta: {} })
    qc.setQueryData(summaryKey, { data: {}, meta: {} })
    qc.setQueryData(detailKey, { id: "c1" })

    invalidateContractorSummariesAndLists(qc)

    expect(qc.getQueryState(listKey)?.isInvalidated).toBe(true)
    expect(qc.getQueryState(summaryKey)?.isInvalidated).toBe(true)
    expect(qc.getQueryState(detailKey)?.isInvalidated).toBeFalsy()
  })
})

import { QueryClient } from "@tanstack/react-query"
import { describe, expect, it } from "vitest"
import { villasKeys } from "@/features/villas/api/villas.queries"
import { invalidateElecPhasesAfterWrite } from "./elecPhasesQueryCache"

describe("elecPhasesQueryCache", () => {
  it("invalidates villa detail queries and elec-phases cache", () => {
    const qc = new QueryClient()
    const detailKey = villasKeys.detail("v1")
    const areaOptKey = ["elec-phases", "options"]
    qc.setQueryData(detailKey, { id: "v1" })
    qc.setQueryData(areaOptKey, [])

    invalidateElecPhasesAfterWrite(qc)

    expect(qc.getQueryState(detailKey)?.isInvalidated).toBe(true)
    expect(qc.getQueryState(areaOptKey)?.isInvalidated).toBe(true)
  })
})

import { QueryClient } from "@tanstack/react-query"
import { describe, expect, it } from "vitest"
import { dashboardKeys } from "@/features/dashboard/api/dashboard.queries"
import { villasKeys } from "@/features/villas/api/villas.queries"
import { openWorksKeys } from "../api/open-works.queries"
import { invalidateOpenWorksAfterWrite } from "./openWorksQueryCache"

describe("invalidateOpenWorksAfterWrite", () => {
  it("marks open works, villa detail and dashboard stale", () => {
    const qc = new QueryClient()
    const villaId = "22222222-2222-4222-8222-222222222222"
    qc.setQueryData(openWorksKeys.list({ page: 1, limit: 20 }), { data: [] })
    qc.setQueryData(villasKeys.detail(villaId), { id: villaId })
    qc.setQueryData(dashboardKeys.summary(), {})

    invalidateOpenWorksAfterWrite(qc, villaId)

    expect(
      qc.getQueryState(openWorksKeys.list({ page: 1, limit: 20 }))
        ?.isInvalidated,
    ).toBe(true)
    expect(qc.getQueryState(villasKeys.detail(villaId))?.isInvalidated).toBe(
      true,
    )
    expect(qc.getQueryState(dashboardKeys.summary())?.isInvalidated).toBe(true)
  })
})

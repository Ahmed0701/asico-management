import { describe, expect, it, vi } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import { villasKeys } from "@/features/villas/api/villas.queries"
import { dailyLabourKeys } from "../api/daily-labour.queries"
import { invalidateDailyLabourAfterWrite } from "./dailyLabourQueryCache"

describe("invalidateDailyLabourAfterWrite", () => {
  it("invalidates labour list and villa detail", () => {
    const qc = new QueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    invalidateDailyLabourAfterWrite(qc, "villa-9")
    expect(spy).toHaveBeenCalledWith({ queryKey: dailyLabourKeys.all })
    expect(spy).toHaveBeenCalledWith({
      queryKey: villasKeys.detail("villa-9"),
    })
  })
})

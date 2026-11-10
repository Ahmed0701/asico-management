import { describe, expect, it, vi } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import { dashboardKeys } from "@/features/dashboard/api/dashboard.queries"
import { notificationsKeys } from "@/features/notifications/api/notifications.queries"
import { smallWorksKeys } from "../api/small-works.queries"
import { invalidateSmallWorksAfterWrite } from "./smallWorksQueryCache"

describe("invalidateSmallWorksAfterWrite", () => {
  it("invalidates list and dashboard", () => {
    const qc = new QueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    invalidateSmallWorksAfterWrite(qc)
    expect(spy).toHaveBeenCalledWith({ queryKey: smallWorksKeys.all })
    expect(spy).toHaveBeenCalledWith({ queryKey: dashboardKeys.summary() })
    expect(spy).toHaveBeenCalledWith({ queryKey: notificationsKeys.all })
  })
})

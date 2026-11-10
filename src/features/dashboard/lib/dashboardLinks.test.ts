import { describe, expect, it } from "vitest"
import { dashboardLinks } from "./dashboardLinks"

describe("dashboardLinks labour", () => {
  it("links to all-time labour tab without date filters", () => {
    expect(dashboardLinks.labourAllTime()).toBe(
      "/site-reports?tab=labour&labourPage=1",
    )
  })
})

describe("dashboardLinks small works", () => {
  it("links overdue and due soon filters", () => {
    expect(dashboardLinks.smallWorksOverdue()).toBe("/small-works?overdue=true")
    expect(dashboardLinks.smallWorksDueSoon()).toBe("/small-works?dueSoon=true")
  })

  it("links villa small works tab with highlight", () => {
    expect(dashboardLinks.villaSmallWorkHighlight("villa-1", "work-1")).toBe(
      "/villas/villa-1?tab=smallWorks&highlightSmallWork=work-1",
    )
  })
})

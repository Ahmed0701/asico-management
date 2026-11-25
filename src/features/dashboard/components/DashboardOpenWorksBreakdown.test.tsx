import { render, screen, within } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"
import i18n from "@/shared/i18n"
import type { DashboardOpenWorks } from "../api/dashboard.types"
import DashboardOpenWorksBreakdown from "./DashboardOpenWorksBreakdown"

function renderOpenWorks(
  byStatus: DashboardOpenWorks["byStatus"],
  overdue: number,
) {
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <DashboardOpenWorksBreakdown
          openWorks={{
            total: 0,
            delayed: byStatus.DELAYED,
            byStatus,
            overdue,
            overdueList: [],
          }}
        />
      </MemoryRouter>
    </I18nextProvider>,
  )
}

describe("DashboardOpenWorksBreakdown", () => {
  it("shows each status still to finish with its count and share, opening its list; done works are left out", () => {
    renderOpenWorks(
      { NOT_STARTED: 10, IN_PROGRESS: 25, DELAYED: 5, DONE: 60 },
      7,
    )

    expect(screen.getByText("Total: 40")).toBeTruthy()
    const tiles = within(screen.getByRole("list")).getAllByRole("link")
    expect(tiles.map((tile) => tile.textContent)).toEqual([
      "Not started1025%",
      "In progress2563%",
      "Delayed512%",
    ])
    expect(tiles.map((tile) => tile.getAttribute("href"))).toEqual([
      "/villas/open-works?status=NOT_STARTED",
      "/villas/open-works?status=IN_PROGRESS",
      "/villas/open-works?status=DELAYED",
    ])
    expect(screen.getByRole("link", { name: "Delayed: 5" })).toBeTruthy()
    expect(
      screen
        .getByRole("link", { name: "7 overdue open works" })
        .getAttribute("href"),
    ).toBe("/villas/open-works?overdue=true")
  })

  it("says so when every open work is done", () => {
    renderOpenWorks({ NOT_STARTED: 0, IN_PROGRESS: 0, DELAYED: 0, DONE: 9 }, 0)

    expect(screen.getByText("No open works")).toBeTruthy()
    expect(screen.queryByRole("list")).toBeNull()
  })
})

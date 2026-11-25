import { render, screen, within } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { describe, expect, it } from "vitest"
import i18n from "@/shared/i18n"
import type { DashboardProgress } from "../api/dashboard.types"
import DashboardProgressBreakdown from "./DashboardProgressBreakdown"

function renderProgress(progress: DashboardProgress) {
  return render(
    <I18nextProvider i18n={i18n}>
      <DashboardProgressBreakdown progress={progress} />
    </I18nextProvider>,
  )
}

const fillOf = (container: HTMLElement) =>
  container.querySelector("[data-slot='progress-ring-fill']")

describe("DashboardProgressBreakdown", () => {
  it("shows the average in the ring, and each state with its count and share", () => {
    const { container } = renderProgress({
      average: 42.5,
      notStarted: 10,
      inProgress: 25,
      done: 5,
    })

    expect(screen.getByText("42.5%")).toBeTruthy()
    const fill = fillOf(container)!
    const length = Number(fill.getAttribute("stroke-dasharray"))
    const offset = Number(fill.getAttribute("stroke-dashoffset"))
    expect(1 - offset / length).toBeCloseTo(0.425)

    const tiles = within(screen.getByRole("list"))
      .getAllByRole("listitem")
      .map((li) => li.textContent)
    expect(tiles).toEqual([
      "Not started1025%",
      "In progress (phases)2563%",
      "Done (all phases)512%",
    ])
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe(
      "Not started 10, in progress 25, done 5, out of 40 villas",
    )
  })

  it("draws no part for a state with no villas, and never calls one villa 0% nor all but one 100%", () => {
    renderProgress({ average: 99.9, notStarted: 0, inProgress: 1, done: 999 })

    expect(screen.getByRole("img").children).toHaveLength(2)
    expect(screen.getByText("<1%")).toBeTruthy()
    expect(screen.getByText(">99%")).toBeTruthy()
    expect(screen.getByText("0%")).toBeTruthy()
  })

  it("leaves the ring empty at 0, and says so when there are no villas", () => {
    const { container, unmount } = renderProgress({
      average: 0,
      notStarted: 3,
      inProgress: 0,
      done: 0,
    })
    expect(fillOf(container)).toBeNull()
    unmount()

    renderProgress({ average: 0, notStarted: 0, inProgress: 0, done: 0 })
    expect(screen.getByText(i18n.t("dashboard.noVillas"))).toBeTruthy()
  })
})

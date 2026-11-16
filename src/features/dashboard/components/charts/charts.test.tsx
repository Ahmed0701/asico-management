import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import PhaseStatusChart, { PhaseStatusLegend } from "./PhaseStatusChart"
import { columnPath, niceMax, slotCenter } from "./chartScale"

describe("chart scales", () => {
  it("rounds an axis top up to 1, 2 or 5 times a power of ten", () => {
    expect(niceMax(0)).toBe(1)
    expect(niceMax(7)).toBe(10)
    expect(niceMax(13)).toBe(20)
    expect(niceMax(420)).toBe(500)
    expect(niceMax(2_000_000)).toBe(2_000_000)
  })

  it("puts the first slot on the left, or on the right in a right-to-left page", () => {
    expect(slotCenter(0, 4, 0, 400, false)).toBe(50)
    expect(slotCenter(3, 4, 0, 400, false)).toBe(350)
    expect(slotCenter(0, 4, 0, 400, true)).toBe(350)
  })

  it("draws nothing for an empty bar, and a closed path otherwise", () => {
    expect(columnPath(0, 10, 20, 0)).toBe("")
    expect(columnPath(0, 10, 20, 50)).toMatch(/^M0,60 .* Z$/)
  })
})

describe("the open works by phase", () => {
  const rows = [
    { elecPhaseId: "a", name: "Ceiling piping", notStarted: 1, inProgress: 2, delayed: 3, done: 4 },
    { elecPhaseId: "b", name: "Wiring", notStarted: 0, inProgress: 0, delayed: 0, done: 0 },
  ]

  it("names every segment with its phase, status and count, and totals each phase", () => {
    render(<PhaseStatusChart rows={rows} />)

    expect(screen.getByText("Ceiling piping")).toBeTruthy()
    expect(screen.getByText("10")).toBeTruthy()
    // A segment a status (none for a zero count), each one named for screen readers.
    expect(screen.getAllByRole("button")).toHaveLength(4)
    expect(screen.getByRole("button", { name: /Ceiling piping.*3/ })).toBeTruthy()
  })

  it("adds each status up over every phase in the legend", () => {
    render(<PhaseStatusLegend rows={rows} />)

    expect(screen.getAllByRole("listitem")).toHaveLength(4)
    expect(screen.getByText("4")).toBeTruthy()
  })
})

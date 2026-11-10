import { render, screen } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { describe, expect, it } from "vitest"
import i18n from "@/shared/i18n"
import type { SmallWork } from "../api"
import SmallWorkAlertBadge from "./SmallWorkAlertBadge"

const base: SmallWork = {
  id: "1",
  villa: { id: "v1", villaNumber: "P-1", location: "Loc" },
  contractor: { id: "c1", name: "Co" },
  startDate: "2026-01-01",
  endDate: "2026-01-05",
  deadlineAt: "2026-01-05T21:00:00.000Z",
  overdue: false,
  dueSoon: false,
  description: "x",
  status: "PENDING",
  createdBy: null,
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

function renderBadge(row: SmallWork) {
  return render(
    <I18nextProvider i18n={i18n}>
      <SmallWorkAlertBadge row={row} />
    </I18nextProvider>,
  )
}

describe("SmallWorkAlertBadge", () => {
  it("shows overdue from server flag only", () => {
    renderBadge({ ...base, overdue: true })
    expect(screen.getByText("Overdue")).toBeInTheDocument()
  })

  it("shows due soon from server flag only", () => {
    renderBadge({ ...base, dueSoon: true })
    expect(screen.getByText("Due soon")).toBeInTheDocument()
  })

  it("shows neither for done works", () => {
    const { container } = renderBadge({
      ...base,
      status: "DONE",
      overdue: true,
      dueSoon: true,
    })
    expect(container).toBeEmptyDOMElement()
  })
})

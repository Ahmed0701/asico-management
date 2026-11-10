import { render, screen } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"
import i18n from "@/shared/i18n"
import DashboardSmallWorksSection from "./DashboardSmallWorksSection"

describe("DashboardSmallWorksSection", () => {
  it("renders urgent list links", () => {
    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <DashboardSmallWorksSection
            smallWorks={{
              total: 12,
              pending: 9,
              overdue: 1,
              dueSoon: 2,
              urgent: [
                {
                  id: "work-1",
                  villa: { id: "villa-1", villaNumber: "P-014" },
                  description: "Repair wall",
                  contractor: { id: "c1", name: "Nile" },
                  endDate: "2026-02-27",
                  deadlineAt: "2026-02-27T21:00:00.000Z",
                  alert: "overdue",
                },
              ],
            }}
          />
        </I18nextProvider>
      </MemoryRouter>,
    )
    expect(screen.getByRole("link", { name: "P-014" })).toHaveAttribute(
      "href",
      "/villas/villa-1?tab=smallWorks&highlightSmallWork=work-1",
    )
    expect(screen.getByText("Overdue")).toBeInTheDocument()
  })

  it("renders nothing when urgent list is empty", () => {
    const { container } = render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <DashboardSmallWorksSection
            smallWorks={{
              total: 0,
              pending: 0,
              overdue: 0,
              dueSoon: 0,
              urgent: [],
            }}
          />
        </I18nextProvider>
      </MemoryRouter>,
    )
    expect(container).toBeEmptyDOMElement()
  })
})

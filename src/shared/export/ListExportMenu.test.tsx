import { render, screen } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { describe, expect, it, vi } from "vitest"
import i18n from "@/shared/i18n"
import { ExportProvider } from "./ExportProvider"
import { ListExportMenu } from "./ListExportMenu"

function renderMenu(props: {
  total: number | undefined
  listLoading?: boolean
}) {
  return render(
    <I18nextProvider i18n={i18n}>
      <ExportProvider>
        <ListExportMenu
          total={props.total}
          listLoading={props.listLoading}
          onExport={vi.fn()}
        />
      </ExportProvider>
    </I18nextProvider>,
  )
}

describe("ListExportMenu", () => {
  it("disables export when total is zero and shows no-data hint", () => {
    renderMenu({ total: 0 })
    const trigger = screen.getByRole("button", { name: /export list/i })
    expect(trigger).toBeDisabled()
    expect(screen.getAllByText("No data to export").length).toBeGreaterThan(0)
  })

  it("disables export while the list is loading", () => {
    renderMenu({ total: undefined, listLoading: true })
    const trigger = screen.getByRole("button", { name: /export list/i })
    expect(trigger).toBeDisabled()
  })

  it("enables export when total is positive", () => {
    renderMenu({ total: 3 })
    const trigger = screen.getByRole("button", { name: /export list/i })
    expect(trigger).not.toBeDisabled()
    expect(
      screen.getByText(/Exports all 3 matching records/),
    ).toBeInTheDocument()
  })
})

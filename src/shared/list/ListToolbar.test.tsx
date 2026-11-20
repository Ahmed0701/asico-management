import { fireEvent, render, screen } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { describe, expect, it, vi } from "vitest"
import i18n from "@/shared/i18n"
import ListToolbar, { clearedListParams, countActive } from "./ListToolbar"

function renderToolbar(props: Partial<Parameters<typeof ListToolbar>[0]> = {}) {
  const onSearch = vi.fn()
  const onClear = vi.fn()
  render(
    <I18nextProvider i18n={i18n}>
      <ListToolbar
        search={{ value: "", onChange: onSearch, placeholder: "Search villas" }}
        onClear={onClear}
        {...props}
      >
        <label>
          Status
          <select aria-label="Status" />
        </label>
      </ListToolbar>
    </I18nextProvider>,
  )
  return { onSearch, onClear }
}

describe("ListToolbar", () => {
  it("shows the title, how many rows match, the search and the filters in their grid", () => {
    const { onSearch } = renderToolbar({ count: 12 })

    expect(
      screen.getByRole("region", { name: "Search and filters" }),
    ).toBeTruthy()
    expect(screen.getByTestId("list-toolbar-count").textContent).toBe(
      "12 results",
    )
    fireEvent.change(screen.getByRole("textbox", { name: "Search villas" }), {
      target: { value: "V-1" },
    })
    expect(onSearch).toHaveBeenCalledWith("V-1")
    expect(
      screen.getByLabelText("Status").closest(".list-toolbar-filters"),
    ).toBeTruthy()
  })

  it("shows how many filters are set and clears them; nothing when none is set", () => {
    const { onClear } = renderToolbar({ activeCount: 2 })
    expect(screen.getByText("2 active")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }))
    expect(onClear).toHaveBeenCalled()
  })

  it("hides the chip and Clear filters when no filter is set", () => {
    renderToolbar({ activeCount: 0 })
    expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull()
  })

  it("puts the page's buttons on the title row", () => {
    renderToolbar({ actions: <button type="button">Add</button> })
    expect(screen.getByRole("button", { name: "Add" })).toBeTruthy()
  })
})

describe("countActive", () => {
  it("counts the values that are set: not empty, not false", () => {
    expect(countActive("x", "", undefined, null, false, true, 0, "y")).toBe(4)
  })
})

describe("clearedListParams", () => {
  it("keeps only the sort, the page size and the tab", () => {
    const cleared = clearedListParams(
      new URLSearchParams(
        "search=v&status=PAID&page=3&sort=amount:desc&limit=50&tab=expenses",
      ),
    )
    expect(cleared.toString()).toBe("sort=amount%3Adesc&limit=50&tab=expenses")
  })
})

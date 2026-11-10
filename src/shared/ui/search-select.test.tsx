import { fireEvent, render, screen } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { describe, expect, it, vi } from "vitest"
import i18n from "@/shared/i18n"
import { SearchSelect } from "./search-select"

const OPTIONS = [
  { value: "v1", label: "1001" },
  { value: "v2", label: "1002" },
  { value: "v3", label: "2001" },
]

function renderSelect(value = "", onChange = vi.fn()) {
  render(
    <I18nextProvider i18n={i18n}>
      <SearchSelect
        aria-label="Villa"
        value={value}
        onChange={onChange}
        options={OPTIONS}
        clearable
      />
    </I18nextProvider>,
  )
  return { input: screen.getByRole("combobox"), onChange }
}

describe("SearchSelect", () => {
  it("filters the list as you type, and picks an option with a click", () => {
    const { input, onChange } = renderSelect()

    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: "100" } })

    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "1001",
      "1002",
    ])
    fireEvent.mouseDown(screen.getByRole("option", { name: "1002" }))
    expect(onChange).toHaveBeenCalledWith("v2")
    expect(screen.queryByRole("listbox")).toBeNull()
  })

  it("picks with the arrow keys and Enter, and says when nothing matches", () => {
    const { input, onChange } = renderSelect()

    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: "zzz" } })
    expect(screen.getByText(i18n.t("common.noMatches"))).toBeInTheDocument()

    fireEvent.change(input, { target: { value: "" } })
    fireEvent.keyDown(input, { key: "ArrowDown" })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onChange).toHaveBeenCalledWith("v2")
  })

  it("shows the chosen option, and clears it with ×", () => {
    const { input, onChange } = renderSelect("v3")

    expect(input).toHaveValue("2001")
    fireEvent.mouseDown(
      screen.getByRole("button", { name: i18n.t("common.clear") }),
    )
    expect(onChange).toHaveBeenCalledWith("")
  })
})

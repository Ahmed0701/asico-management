import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"
import { initialsOf, PersonCell, VillaCell } from "./cells"

describe("the list cells", () => {
  it("takes up to two initials from a name", () => {
    expect(initialsOf("Mona Hassan")).toBe("MH")
    expect(initialsOf("  nile   builders co ")).toBe("NB")
    expect(initialsOf("Omar")).toBe("O")
  })

  it("shows a person with their initials, and a dash when there is none", () => {
    const { container } = render(<PersonCell name="Mona Hassan" />)
    expect(screen.getByText("Mona Hassan")).toBeTruthy()
    expect(container.textContent).toContain("MH")

    render(<PersonCell name={null} />)
    expect(screen.getByText("-")).toBeTruthy()
  })

  it("links the villa number to the villa, with the line under it", () => {
    render(
      <MemoryRouter>
        <VillaCell id="v1" villaNumber="V-12" sub="Sabah . B1 . 12" />
      </MemoryRouter>,
    )

    expect(screen.getByRole("link", { name: "V-12" }).getAttribute("href")).toBe("/villas/v1")
    expect(screen.getByText("Sabah . B1 . 12")).toBeTruthy()
  })

  it("shows the number as plain text without an id, or links where it is told to", () => {
    render(
      <MemoryRouter>
        <VillaCell villaNumber="M-3" />
        <VillaCell id="v2" villaNumber="V-2" to="/villas/v2?tab=materials" />
      </MemoryRouter>,
    )

    expect(screen.queryByRole("link", { name: "M-3" })).toBeNull()
    expect(screen.getByText("M-3")).toBeTruthy()
    expect(screen.getByRole("link", { name: "V-2" }).getAttribute("href")).toBe(
      "/villas/v2?tab=materials",
    )
  })
})

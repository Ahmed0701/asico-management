import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Table, TableHeader, TableRow } from "@/shared/ui/table"
import SortableHead, { nextSortOf, sortModeOf } from "./SortableHead"

describe("the sort of a column", () => {
  it("reads a bare field as ascending, and only its own field", () => {
    expect(sortModeOf(undefined, "villaNumber")).toBe("none")
    expect(sortModeOf("villaNumber", "villaNumber")).toBe("asc")
    expect(sortModeOf("villaNumber:asc", "villaNumber")).toBe("asc")
    expect(sortModeOf("villaNumber:desc", "villaNumber")).toBe("desc")
    expect(sortModeOf("createdAt:desc", "villaNumber")).toBe("none")
  })

  it("asks for ascending first, then descending, then ascending again", () => {
    expect(nextSortOf(undefined, "villaNumber")).toBe("villaNumber:asc")
    expect(nextSortOf("villaNumber:asc", "villaNumber")).toBe(
      "villaNumber:desc",
    )
    expect(nextSortOf("villaNumber:desc", "villaNumber")).toBe(
      "villaNumber:asc",
    )
    expect(nextSortOf("createdAt:desc", "villaNumber")).toBe("villaNumber:asc")
  })
})

describe("SortableHead", () => {
  const renderHead = (sort: string | undefined, onSort = vi.fn()) => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead
              label="Villa Number"
              field="villaNumber"
              sort={sort}
              onSort={onSort}
            />
          </TableRow>
        </TableHeader>
      </Table>,
    )
    return onSort
  }

  it("tells screen readers how the column is sorted, and asks for the next sort on click", () => {
    const onSort = renderHead("villaNumber:asc")

    expect(screen.getByRole("columnheader").getAttribute("aria-sort")).toBe(
      "ascending",
    )
    fireEvent.click(screen.getByRole("button", { name: /Villa Number/ }))
    expect(onSort).toHaveBeenCalledWith("villaNumber:desc")
  })

  it("is marked unsorted when the list is sorted by something else", () => {
    renderHead("createdAt:desc")

    expect(screen.getByRole("columnheader").getAttribute("aria-sort")).toBe(
      "none",
    )
  })
})

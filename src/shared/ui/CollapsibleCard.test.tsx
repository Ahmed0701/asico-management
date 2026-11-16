import { fireEvent, render, screen } from "@testing-library/react"
import { Package } from "lucide-react"
import { describe, expect, it, vi } from "vitest"
import { daysUntil } from "@/features/villas/lib/villaDetailDisplay"
import CollapsibleCard from "./CollapsibleCard"

describe("CollapsibleCard", () => {
  it("renders its body only once opened, and says whether it is open", () => {
    render(
      <CollapsibleCard title="Materials" icon={Package}>
        <p>the body</p>
      </CollapsibleCard>,
    )
    const header = screen.getByRole("button", { name: /Materials/ })

    expect(header.getAttribute("aria-expanded")).toBe("false")
    expect(screen.queryByText("the body")).toBeNull()
    fireEvent.click(header)
    expect(header.getAttribute("aria-expanded")).toBe("true")
    expect(screen.getByText("the body")).toBeTruthy()
  })

  it("lets the parent decide when it is controlled", () => {
    const onOpenChange = vi.fn()
    render(
      <CollapsibleCard
        title="Vendors"
        icon={Package}
        open={false}
        onOpenChange={onOpenChange}
      >
        <p>vendors</p>
      </CollapsibleCard>,
    )

    fireEvent.click(screen.getByRole("button", { name: /Vendors/ }))
    expect(onOpenChange).toHaveBeenCalledWith(true)
    // Still closed: the parent has not opened it.
    expect(screen.queryByText("vendors")).toBeNull()
  })
})

describe("daysUntil", () => {
  const now = new Date(2026, 10, 16, 15, 30)

  it("counts whole calendar days to the target, negative once it has passed", () => {
    expect(daysUntil("2026-11-16", now)).toBe(0)
    expect(daysUntil("2026-11-30", now)).toBe(14)
    expect(daysUntil("2026-11-13", now)).toBe(-3)
    expect(daysUntil("2027-01-01", now)).toBe(46)
  })
})

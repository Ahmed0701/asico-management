import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"
import i18n from "@/shared/i18n"
import VillaVendorsCard from "./VillaVendorsCard"

const http = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock("@/shared/api/client", async (importActual) => ({
  ...(await importActual<typeof import("@/shared/api/client")>()),
  api: http,
}))

describe("VillaVendorsCard", () => {
  it("shows the factories assigned to the villa on the Vendors page, loaded when opened", async () => {
    http.get.mockResolvedValue({
      data: {
        data: {
          villa: { id: "v1", villaNumber: "V-12", location: "" },
          switchgear: { id: "f1", name: "Gulf Switchgear" },
          cable: null,
          version: 3,
          listedAt: "2026-11-18T08:00:00.000Z",
        },
      },
    })
    render(
      <QueryClientProvider client={new QueryClient()}>
        <I18nextProvider i18n={i18n}>
          <MemoryRouter>
            <VillaVendorsCard villaId="v1" villaNumber="V-12" />
          </MemoryRouter>
        </I18nextProvider>
      </QueryClientProvider>,
    )
    expect(http.get).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: /Vendors/ }))

    const switchgear = await screen.findByRole("region", {
      name: "Villa Switchgear Factory",
    })
    expect(within(switchgear).getByText("Gulf Switchgear")).toBeTruthy()
    const cable = screen.getByRole("region", { name: "Cable Factory" })
    expect(
      within(cable).getByText("Not assigned on the Vendors page"),
    ).toBeTruthy()
    expect(http.get).toHaveBeenCalledWith("/villas/v1/vendors")
    expect(screen.getByText("1 of 2 assigned")).toBeTruthy()
    expect(
      screen
        .getByRole("link", { name: "Assign the villa's vendors" })
        .getAttribute("href"),
    ).toBe("/vendors?search=V-12")
  })
})

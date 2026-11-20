import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { describe, expect, it, vi } from "vitest"
import i18n from "@/shared/i18n"
import DeliveryFormModal from "./DeliveryFormModal"

const factories = [
  { id: "f1", name: "Gulf Switchgear", type: "SWITCHGEAR" },
  { id: "f2", name: "Alfanar", type: "SWITCHGEAR" },
  { id: "f3", name: "Kuwait Cables", type: "CABLE" },
]

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock("@/shared/api/client", async (importActual) => ({
  ...(await importActual<typeof import("@/shared/api/client")>()),
  api: http,
}))

function renderForm() {
  http.get.mockImplementation(async (url: string) => {
    if (url === "/factories") return { data: { data: factories } }
    if (url === "/villas/v1/vendors") {
      return {
        data: {
          data: {
            villa: { id: "v1", villaNumber: "V-12", location: "" },
            switchgear: { id: "f2", name: "Alfanar" },
            cable: { id: "f3", name: "Kuwait Cables" },
            version: 1,
            listedAt: null,
          },
        },
      }
    }
    if (url === "/villas/options") {
      return { data: { data: [{ id: "v1", villaNumber: "V-12" }] } }
    }
    return { data: { data: [] } }
  })
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <I18nextProvider i18n={i18n}>
        <DeliveryFormModal open villaId="v1" onClose={() => {}} />
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

describe("DeliveryFormModal and the villa's vendors", () => {
  it("fills the factory with the villa's vendor of the type, and follows the type", async () => {
    renderForm()

    const factory = screen.getByLabelText("Factory") as HTMLSelectElement
    // Switchgear first: the villa's switchgear vendor.
    await waitFor(() => expect(factory.value).toBe("f2"))
    expect(screen.getByText("From the villa's vendors")).toBeTruthy()

    fireEvent.change(screen.getByLabelText("Type"), {
      target: { value: "CABLE" },
    })
    await waitFor(() => expect(factory.value).toBe("f3"))
  })

  it("keeps a factory picked by hand, and says it is not the villa's vendor", async () => {
    renderForm()
    const factory = screen.getByLabelText("Factory") as HTMLSelectElement
    await waitFor(() => expect(factory.value).toBe("f2"))

    fireEvent.change(factory, { target: { value: "f1" } })
    expect(factory.value).toBe("f1")
    expect(screen.getByText("Not the villa's vendor (Alfanar)")).toBeTruthy()
  })
})

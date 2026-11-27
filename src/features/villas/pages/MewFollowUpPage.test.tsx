import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, within } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ExportProvider } from "@/shared/export/ExportProvider"
import i18n from "@/shared/i18n"
import type { VillaListItem } from "../api"
import MewFollowUpPage from "./MewFollowUpPage"

const party = { id: "p", name: "P" }
const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86_400_000).toISOString()
const villa = (over: Partial<VillaListItem>): VillaListItem => ({
  id: "v1",
  villaNumber: "V-1",
  ownerName: "Ahmad Saleh",
  villaType: null,
  area: "Sabah",
  areaId: "a",
  block: "1",
  plot: "1",
  location: "Sabah . B1 . P1",
  civilEngineer: party,
  electricalEngineer: null,
  contractor: null,
  startDate: null,
  targetDate: null,
  budgetMinor: null,
  currency: null,
  progress: 40,
  mewFollowUp: { at: daysAgo(12), by: null },
  mewInspection: null,
  mewInspectionPassed: null,
  mewAcState: "RUNNING",
  mewElecState: "APPROVED",
  mewInspectionDate: null,
  electricityConnectionDate: null,
  version: 1,
  createdAt: daysAgo(30),
  updatedAt: daysAgo(1),
  ...over,
})
const rows = [
  villa({}),
  villa({
    id: "v2",
    villaNumber: "V-2",
    ownerName: null,
    mewAcState: "APPROVED",
    mewFollowUp: { at: daysAgo(0), by: null },
  }),
  villa({
    id: "v3",
    villaNumber: "V-3",
    mewAcState: "APPROVED",
    mewInspection: { at: daysAgo(1), by: null },
    mewInspectionDate: "2026-12-01",
  }),
]

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))
vi.mock("@/shared/api/client", async (importActual) => ({
  ...(await importActual<typeof import("@/shared/api/client")>()),
  api: http,
}))
const perms = vi.hoisted(() => ({ edit: true }))
vi.mock("@/features/auth/api", async (importActual) => ({
  ...(await importActual<typeof import("@/features/auth/api")>()),
  usePermissions: () => ({
    can: (code: string) => code !== "villas:inspection" || perms.edit,
  }),
}))

function renderPage() {
  http.get.mockImplementation(async (url: string) => {
    if (url === "/villas") {
      return {
        data: {
          data: rows,
          meta: { page: 1, limit: 20, total: 3, totalPages: 1 },
        },
      }
    }
    if (url === "/villas/options") return { data: { data: [] } }
    return {
      data: { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    }
  })
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={["/mew-follow-up"]}>
          <ExportProvider>
            <MewFollowUpPage />
          </ExportProvider>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  perms.edit = true
})

describe("MEW follow up", () => {
  it("sums up where the villas stand", async () => {
    renderPage()
    const summary = await screen.findByRole("region", {
      name: "MEW follow up at a glance",
    })
    await within(summary).findByText("Villas on the list")
    const tile = (label: string) =>
      within(summary).getByText(label).previousSibling?.textContent
    expect(tile("Villas on the list")).toBe("3")
    expect(tile("Waiting for approval")).toBe("1")
    expect(tile("Ready for inspection")).toBe("1")
    expect(tile("On MEW inspection")).toBe("1")
  })

  it("shows each villa with its owner, location, stage and how long it has been on the list", async () => {
    renderPage()
    const v1 = (await screen.findByRole("link", { name: "V-1" })).closest("tr")!
    expect(within(v1).getByText("Ahmad Saleh")).toBeTruthy()
    expect(within(v1).getByText("Sabah . B1 . P1")).toBeTruthy()
    expect(within(v1).getByText("Waiting for approval")).toBeTruthy()
    expect(within(v1).getByText("12 days")).toBeTruthy()
    // Not both approved: it cannot be sent for inspection yet.
    expect(
      (within(v1).getByRole("button", {
        name: /MEW Inspection/,
      }) as HTMLButtonElement).disabled,
    ).toBe(true)

    const v2 = screen.getByRole("link", { name: "V-2" }).closest("tr")!
    expect(within(v2).getByText("No owner name")).toBeTruthy()
    expect(within(v2).getByText("Ready for inspection")).toBeTruthy()
    expect(within(v2).getByText("Today")).toBeTruthy()
    expect(
      (within(v2).getByRole("button", {
        name: /MEW Inspection/,
      }) as HTMLButtonElement).disabled,
    ).toBe(false)

    const v3 = screen.getByRole("link", { name: "V-3" }).closest("tr")!
    expect(within(v3).getByText("On MEW inspection")).toBeTruthy()
    expect(
      within(v3).getByRole("button", { name: /Remove from inspection/ }),
    ).toBeTruthy()
  })

  it("asks only for the villas on follow up that have not passed the MEW inspection", async () => {
    renderPage()
    await screen.findByRole("link", { name: "V-1" })
    const listCall = http.get.mock.calls.find(([url]) => url === "/villas")!
    expect(listCall[1].params).toMatchObject({ mewFollowUp: "true", mewInspectionPassed: "false" })
  })

  it("only reads the list without villas:inspection", async () => {
    perms.edit = false
    renderPage()
    const v3 = (await screen.findByRole("link", { name: "V-3" })).closest("tr")!
    expect(within(v3).queryByRole("button")).toBeNull()
    expect(within(v3).getByText(/Dec 2026/)).toBeTruthy()
    expect(
      screen.queryByRole("button", { name: /Add to MEW follow up/ }),
    ).toBeNull()
  })
})

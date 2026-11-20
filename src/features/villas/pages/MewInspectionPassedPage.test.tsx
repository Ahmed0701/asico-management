import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/shared/i18n"
import type { VillaListItem } from "../api"
import MewInspectionPassedPage from "./MewInspectionPassedPage"

const party = { id: "p", name: "P" }
const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86_400_000).toISOString()
const villa = (
  id: string,
  villaNumber: string,
  passedDaysAgo: number,
): VillaListItem => ({
  id,
  villaNumber,
  ownerName: "Owner",
  villaType: null,
  area: "Sabah",
  areaId: "a",
  block: "1",
  plot: "1",
  location: "Sabah . B1",
  civilEngineer: party,
  electricalEngineer: null,
  contractor: null,
  startDate: null,
  targetDate: null,
  budgetMinor: null,
  currency: null,
  progress: 100,
  mewFollowUp: { at: daysAgo(90), by: null },
  mewInspection: { at: daysAgo(60), by: null },
  mewInspectionPassed: {
    at: daysAgo(passedDaysAgo),
    by: { id: "u1", name: "Sara" },
  },
  mewAcState: "APPROVED",
  mewElecState: "APPROVED",
  mewInspectionDate: null,
  version: 1,
  createdAt: daysAgo(200),
  updatedAt: daysAgo(1),
})
// One passed 3 days ago, one 400 days ago (not this month, not this week).
const rows = [villa("v1", "V-1", 3), villa("v2", "V-2", 400)]
const report = {
  villaId: "v1",
  name: "passed-v1.pdf",
  size: 1000,
  uploadedBy: null,
  uploadedAt: daysAgo(3),
}

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
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
    if (url === "/villas")
      return {
        data: {
          data: rows,
          meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
        },
      }
    if (url === "/mew-inspection-reports") return { data: { data: [report] } }
    throw new Error(`unexpected GET ${url}`)
  })
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={["/villas/mew-inspection-passed"]}>
          <MewInspectionPassedPage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  perms.edit = true
})

describe("MEW Inspection Passed", () => {
  it("sums up the passed villas, and shows when and by whom each passed, with its report", async () => {
    renderPage()
    const summary = await screen.findByRole("region", {
      name: "MEW inspection passed at a glance",
    })
    await waitFor(() =>
      expect(
        within(summary).getByText("Report uploaded").previousSibling
          ?.textContent,
      ).toBe("1"),
    )
    const tile = (label: string) =>
      within(summary).getByText(label).previousSibling?.textContent
    expect(tile("Villas passed")).toBe("2")
    expect(tile("Passed in the last 7 days")).toBe("1")

    const v1 = screen.getByRole("link", { name: "V-1" }).closest("tr")!
    expect(within(v1).getByText(/3 days ago · Sara/)).toBeTruthy()
    expect(within(v1).getByText("passed-v1.pdf")).toBeTruthy()
  })

  it("moves a villa back to the inspection list", async () => {
    http.delete.mockResolvedValue({ data: { data: rows[0] } })
    renderPage()
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Take back the passed inspection of villa V-1",
      }),
    )
    await waitFor(() =>
      expect(http.delete).toHaveBeenCalledWith(
        "/villas/v1/mew-inspection-passed",
        expect.anything(),
      ),
    )
  })

  it("only reads the list without villas:inspection", async () => {
    perms.edit = false
    renderPage()
    await screen.findByRole("link", { name: "V-1" })
    expect(screen.queryByRole("button", { name: /Take back/ })).toBeNull()
  })
})

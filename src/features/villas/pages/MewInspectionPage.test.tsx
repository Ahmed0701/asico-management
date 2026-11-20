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
import MewInspectionPage from "./MewInspectionPage"

const party = { id: "p", name: "P" }
// A day relative to today, YYYY-MM-DD in local time (as the page reads it).
const dayFromToday = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  const pad = (x: number) => String(x).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const villa = (
  id: string,
  villaNumber: string,
  inspectionDay: string | null = null,
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
  progress: 80,
  mewFollowUp: { at: "2026-10-01T09:00:00.000Z", by: null },
  mewInspection: { at: "2026-11-01T09:00:00.000Z", by: null },
  mewInspectionPassed: null,
  mewAcState: "APPROVED",
  mewElecState: "APPROVED",
  mewInspectionDate: inspectionDay,
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
})
const rows = [
  villa("v1", "V-1", dayFromToday(5)),
  villa("v2", "V-2", dayFromToday(-2)),
]
const report = {
  villaId: "v1",
  name: "inspection-v1.pdf",
  size: 2048,
  uploadedBy: { id: "u1", name: "Sara" },
  uploadedAt: "2026-11-15T09:00:00.000Z",
}

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
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
  http.get.mockImplementation(
    async (url: string, config?: { params?: Record<string, string> }) => {
      if (url === "/villas")
        return {
          data: {
            data: rows,
            meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
          },
        }
      if (url === "/mew-inspection-reports") {
        expect(config?.params?.villaIds?.split(",").sort()).toEqual([
          "v1",
          "v2",
        ])
        return { data: { data: [report] } }
      }
      throw new Error(`unexpected GET ${url}`)
    },
  )
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={["/villas/mew-inspection"]}>
          <MewInspectionPage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  perms.edit = true
})

describe("MEW Inspection: the list", () => {
  it("sums up the list, and shows how far each inspection day is", async () => {
    renderPage()
    const summary = await screen.findByRole("region", {
      name: "MEW inspection at a glance",
    })
    await waitFor(() =>
      expect(
        within(summary).getByText("Report uploaded").previousSibling
          ?.textContent,
      ).toBe("1"),
    )
    const tile = (label: string) =>
      within(summary).getByText(label).previousSibling?.textContent
    expect(tile("Villas waiting for inspection")).toBe("2")
    expect(tile("Inspection day set")).toBe("2")
    expect(tile("Inspection day passed")).toBe("1")

    const v1 = screen.getByRole("link", { name: "V-1" }).closest("tr")!
    expect(within(v1).getByText("in 5 days")).toBeTruthy()
    const v2 = screen.getByRole("link", { name: "V-2" }).closest("tr")!
    expect(within(v2).getByText("2 days late")).toBeTruthy()
  })

  it("marks a villa as passed", async () => {
    http.post.mockResolvedValue({ data: { data: rows[0] } })
    renderPage()
    const v1 = (await screen.findByRole("link", { name: "V-1" })).closest("tr")!
    // The state reads clearly as not passed; the button is the action that marks it.
    expect(within(v1).getByText("Not passed yet")).toBeTruthy()
    const button = within(v1).getByRole("button", {
      name: "Mark villa V-1 as passed",
    })
    expect(button.textContent).toContain("Mark as passed")
    fireEvent.click(button)
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        "/villas/v1/mew-inspection-passed",
        {},
        expect.anything(),
      ),
    )
  })
})

describe("MEW Inspection: the inspection report", () => {
  it("shows the report of each villa that has one, and an upload button for the others", async () => {
    renderPage()
    const v1 = (await screen.findByRole("link", { name: "V-1" })).closest("tr")!
    expect(await within(v1).findByText("inspection-v1.pdf")).toBeTruthy()
    expect(
      within(v1).getByRole("button", {
        name: "Replace the inspection report of villa V-1",
      }),
    ).toBeTruthy()

    const v2 = screen.getByRole("link", { name: "V-2" }).closest("tr")!
    expect(
      within(v2).getByRole("button", {
        name: "Upload the inspection report of villa V-2",
      }),
    ).toBeTruthy()
  })

  it("uploads a PDF, and refuses another kind of file", async () => {
    http.post.mockResolvedValue({
      data: { data: { ...report, villaId: "v2", name: "v2.pdf" } },
    })
    renderPage()
    const input = (await screen.findByTestId(
      "mew-report-input-v2",
    )) as HTMLInputElement

    fireEvent.change(input, {
      target: { files: [new File(["x"], "photo.png", { type: "image/png" })] },
    })
    expect(http.post).not.toHaveBeenCalled()

    const pdf = new File(["%PDF-1.7"], "v2.pdf", { type: "application/pdf" })
    fireEvent.change(input, { target: { files: [pdf] } })
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        "/villas/v2/mew-inspection-report",
        expect.any(FormData),
        expect.anything(),
      ),
    )
    const sent = http.post.mock.calls[0]![1] as FormData
    expect((sent.get("file") as File).name).toBe("v2.pdf")
  })

  it("removes a report after confirming", async () => {
    http.delete.mockResolvedValue({ data: undefined })
    renderPage()
    const v1 = (await screen.findByRole("link", { name: "V-1" })).closest("tr")!
    fireEvent.click(
      await within(v1).findByRole("button", {
        name: "Remove the inspection report of villa V-1",
      }),
    )
    const dialog = await screen.findByRole("dialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }))
    await waitFor(() =>
      expect(http.delete).toHaveBeenCalledWith(
        "/villas/v1/mew-inspection-report",
      ),
    )
  })

  it("only shows the reports without villas:inspection", async () => {
    perms.edit = false
    renderPage()
    const v1 = (await screen.findByRole("link", { name: "V-1" })).closest("tr")!
    expect(await within(v1).findByText("inspection-v1.pdf")).toBeTruthy()
    expect(within(v1).queryByRole("button", { name: /Replace/ })).toBeNull()
    const v2 = screen.getByRole("link", { name: "V-2" }).closest("tr")!
    expect(within(v2).getByText("No report yet")).toBeTruthy()
  })
})

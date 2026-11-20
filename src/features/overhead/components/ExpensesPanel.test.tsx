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
import type { OverheadExpense } from "../api"
import DepartmentOverheadPage from "../pages/DepartmentOverheadPage"

const invoice: OverheadExpense = {
  id: "x1",
  villa: { id: "v1", villaNumber: "V-12" },
  type: "INVOICE",
  description: "Cable trays",
  amountMinor: 1_250_500,
  expenseDate: "2026-11-10",
  invoiceNumber: "INV-77",
  files: [
    {
      id: "f1",
      name: "invoice.pdf",
      mime: "application/pdf",
      size: 2048,
      uploadedAt: "2026-11-10T08:00:00.000Z",
    },
  ],
  version: 3,
  createdAt: "2026-11-10T08:00:00.000Z",
  updatedAt: "2026-11-10T08:00:00.000Z",
}

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))
vi.mock("@/shared/api/client", async (importActual) => ({
  ...(await importActual<typeof import("@/shared/api/client")>()),
  api: http,
}))
const perms = vi.hoisted(() => ({ codes: new Set<string>() }))
vi.mock("@/features/auth/api", async (importActual) => ({
  ...(await importActual<typeof import("@/features/auth/api")>()),
  usePermissions: () => ({ can: (code: string) => perms.codes.has(code) }),
}))

function renderExpenses() {
  http.get.mockImplementation(async (url: string) => {
    if (url === "/villas/options") {
      return {
        data: {
          data: [
            { id: "v1", villaNumber: "V-12" },
            { id: "v2", villaNumber: "V-15" },
          ],
        },
      }
    }
    return {
      data: {
        data: [invoice],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        totals: { count: 1, amountMinor: 1_250_500 },
      },
    }
  })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={["/department-overhead?tab=expenses"]}>
          <DepartmentOverheadPage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  perms.codes = new Set([
    "overhead:read",
    "overhead:create",
    "overhead:update",
    "overhead:delete",
  ])
})

describe("the Additional Expenses tab", () => {
  it("lists the expenses with their villa, type, invoice number and amount, and the totals", async () => {
    renderExpenses()

    expect(await screen.findByText("Cable trays")).toBeTruthy()
    expect(http.get).toHaveBeenCalledWith(
      "/overhead-expenses",
      expect.anything(),
    )
    expect(
      screen
        .getByRole("tab", { name: "Additional Expenses" })
        .getAttribute("aria-selected"),
    ).toBe("true")
    const row = screen.getByText("Cable trays").closest("tr")!
    expect(within(row).getByRole("link", { name: "V-12" })).toBeTruthy()
    expect(within(row).getByText("Invoice")).toBeTruthy()
    expect(within(row).getByText("Invoice INV-77")).toBeTruthy()
    expect(screen.getByText("Total amount")).toBeTruthy()
  })

  it("adds an expense for a villa, in fils, and then uploads the invoice files picked with it", async () => {
    renderExpenses()
    http.post.mockImplementation(async (url: string) =>
      url === "/overhead-expenses"
        ? { data: { data: { ...invoice, id: "x2", files: [], version: 1 } } }
        : { data: { data: { ...invoice, id: "x2" } } },
    )
    await screen.findByText("Cable trays")

    fireEvent.click(screen.getByRole("button", { name: "Add expense" }))
    const dialog = await screen.findByRole("dialog")
    const villa = within(dialog).getByRole("combobox", { name: "Villa" })
    fireEvent.focus(villa)
    fireEvent.change(villa, { target: { value: "15" } })
    fireEvent.mouseDown(await screen.findByRole("option", { name: "V-15" }))
    fireEvent.change(within(dialog).getByLabelText("Type"), {
      target: { value: "TRANSPORT" },
    })
    fireEvent.change(within(dialog).getByLabelText("Amount (KWD)"), {
      target: { value: "80.5" },
    })
    fireEvent.change(within(dialog).getByLabelText("Date"), {
      target: { value: "2026-11-12" },
    })
    fireEvent.change(within(dialog).getByLabelText("Description"), {
      target: { value: " Truck hire " },
    })
    const photo = new File(["x"], "receipt.png", { type: "image/png" })
    fireEvent.change(screen.getByTestId("expense-files-input"), {
      target: { files: [photo] },
    })
    expect(screen.getByText("receipt.png")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => expect(http.post).toHaveBeenCalledTimes(2))
    expect(http.post.mock.calls[0]![0]).toBe("/overhead-expenses")
    expect(http.post.mock.calls[0]![1]).toEqual({
      villaId: "v2",
      type: "TRANSPORT",
      description: "Truck hire",
      amountMinor: 80_500,
      expenseDate: "2026-11-12",
      invoiceNumber: null,
    })
    expect(http.post.mock.calls[1]![0]).toBe("/overhead-expenses/x2/files")
    const form = http.post.mock.calls[1]![1] as FormData
    expect((form.getAll("file")[0] as File).name).toBe("receipt.png")
  })

  it("refuses an expense without a villa, a type or an amount, without sending anything", async () => {
    renderExpenses()
    await screen.findByText("Cable trays")

    fireEvent.click(screen.getByRole("button", { name: "Add expense" }))
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    expect(
      await screen.findByText("Pick the villa this expense is for"),
    ).toBeTruthy()
    expect(screen.getByText("Pick the type of expense")).toBeTruthy()
    expect(
      screen.getByText("Enter an amount in KWD, up to 3 decimals"),
    ).toBeTruthy()
    expect(http.post).not.toHaveBeenCalled()
  })

  it("changes only the amount, with the version it read", async () => {
    renderExpenses()
    http.patch.mockResolvedValue({
      data: { data: { ...invoice, amountMinor: 1_300_000, version: 4 } },
    })
    await screen.findByText("Cable trays")

    fireEvent.click(
      screen.getByRole("button", { name: "Edit expense Cable trays" }),
    )
    fireEvent.change(screen.getByLabelText("Amount (KWD)"), {
      target: { value: "1300" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => expect(http.patch).toHaveBeenCalled())
    const [path, body, config] = http.patch.mock.calls[0]!
    expect(path).toBe("/overhead-expenses/x1")
    expect(body).toEqual({ amountMinor: 1_300_000 })
    expect(config.headers["If-Match"]).toBe("3")
  })

  it("shows the invoice files of an expense, and removes one", async () => {
    renderExpenses()
    http.delete.mockResolvedValue({ data: { data: { ...invoice, files: [] } } })
    await screen.findByText("Cable trays")

    fireEvent.click(
      screen.getByRole("button", { name: "Files of Cable trays" }),
    )
    expect(await screen.findByText("invoice.pdf")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Remove invoice.pdf" }))

    await waitFor(() =>
      expect(http.delete).toHaveBeenCalledWith(
        "/overhead-expenses/x1/files/f1",
      ),
    )
  })

  it("hides adding, editing, deleting and removing files without those permissions", async () => {
    perms.codes = new Set(["overhead:read"])
    renderExpenses()
    await screen.findByText("Cable trays")

    expect(screen.queryByRole("button", { name: "Add expense" })).toBeNull()
    expect(
      screen.queryByRole("button", { name: "Edit expense Cable trays" }),
    ).toBeNull()
    expect(
      screen.queryByRole("button", { name: "Delete expense Cable trays" }),
    ).toBeNull()
    fireEvent.click(
      screen.getByRole("button", { name: "Files of Cable trays" }),
    )
    expect(await screen.findByText("invoice.pdf")).toBeTruthy()
    expect(
      screen.queryByRole("button", { name: "Remove invoice.pdf" }),
    ).toBeNull()
    expect(
      screen.queryByRole("button", { name: "Attach invoice files" }),
    ).toBeNull()
  })
})

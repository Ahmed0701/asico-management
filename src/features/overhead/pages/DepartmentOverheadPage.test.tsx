import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/shared/i18n"
import type { OverheadEmployee } from "../api"
import DepartmentOverheadPage from "./DepartmentOverheadPage"

const ahmad: OverheadEmployee = {
  id: "e1",
  name: "Ahmad Saleh",
  role: "ENGINEER",
  salaryMinor: 950_000,
  version: 2,
  createdAt: "2026-11-01T08:00:00.000Z",
  updatedAt: "2026-11-01T08:00:00.000Z",
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

function renderPage() {
  http.get.mockResolvedValue({
    data: {
      data: [ahmad],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      totals: { count: 1, monthlySalaryMinor: 950_000 },
    },
  })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
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

describe("DepartmentOverheadPage", () => {
  it("lists the employees with their role and salary, and the monthly and yearly totals", async () => {
    renderPage()

    expect(await screen.findByText("Ahmad Saleh")).toBeTruthy()
    expect(http.get).toHaveBeenCalledWith(
      "/overhead-employees",
      expect.anything(),
    )
    // The role is shown by its label, not its code.
    expect(screen.getByText("Engineer")).toBeTruthy()
    expect(screen.getByText("Monthly salaries")).toBeTruthy()
    expect(screen.getByText("Yearly salaries")).toBeTruthy()
    // 950 KWD a month is 11,400 KWD a year.
    expect(screen.getByText(/11,400/)).toBeTruthy()
  })

  it("adds an employee, sending the salary in fils", async () => {
    renderPage()
    http.post.mockResolvedValue({
      data: { data: { ...ahmad, id: "e2", name: "Bader", version: 1 } },
    })
    await screen.findByText("Ahmad Saleh")

    fireEvent.click(screen.getByRole("button", { name: "Add employee" }))
    fireEvent.change(screen.getByLabelText("Employee name"), {
      target: { value: "  Bader " },
    })
    const role = screen.getByLabelText("Role") as HTMLSelectElement
    expect(Array.from(role.options).map((option) => option.text)).toEqual([
      "Choose a role",
      "Engineer",
      "Foreman",
      "Worker",
      "Driver",
      "Other",
    ])
    fireEvent.change(role, { target: { value: "FOREMAN" } })
    fireEvent.change(screen.getByLabelText("Monthly salary (KWD)"), {
      target: { value: "700.5" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        "/overhead-employees",
        { name: "Bader", role: "FOREMAN", salaryMinor: 700_500 },
        expect.anything(),
      ),
    )
  })

  it("refuses an empty name and a salary that is not a number, without sending anything", async () => {
    renderPage()
    await screen.findByText("Ahmad Saleh")

    fireEvent.click(screen.getByRole("button", { name: "Add employee" }))
    fireEvent.change(screen.getByLabelText("Monthly salary (KWD)"), {
      target: { value: "abc" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    expect(
      await screen.findByText("Enter a name of up to 120 characters"),
    ).toBeTruthy()
    expect(
      screen.getByText("Enter a salary in KWD, up to 3 decimals"),
    ).toBeTruthy()
    expect(screen.getByText("Choose a role from the list")).toBeTruthy()
    expect(http.post).not.toHaveBeenCalled()
  })

  it("changes only the salary, with the version it read", async () => {
    renderPage()
    http.patch.mockResolvedValue({
      data: { data: { ...ahmad, salaryMinor: 1_000_000, version: 3 } },
    })
    await screen.findByText("Ahmad Saleh")

    fireEvent.click(screen.getByRole("button", { name: "Edit Ahmad Saleh" }))
    expect((screen.getByLabelText("Role") as HTMLSelectElement).value).toBe(
      "ENGINEER",
    )
    fireEvent.change(screen.getByLabelText("Monthly salary (KWD)"), {
      target: { value: "1000" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => expect(http.patch).toHaveBeenCalled())
    const [path, body, config] = http.patch.mock.calls[0]!
    expect(path).toBe("/overhead-employees/e1")
    expect(body).toEqual({ salaryMinor: 1_000_000 })
    expect(config.headers["If-Match"]).toBe("2")
  })

  it("deletes an employee after confirming", async () => {
    renderPage()
    http.delete.mockResolvedValue({ data: undefined })
    await screen.findByText("Ahmad Saleh")

    fireEvent.click(screen.getByRole("button", { name: "Delete Ahmad Saleh" }))
    expect(await screen.findByText(/This cannot be undone/)).toBeTruthy()
    const buttons = screen.getAllByRole("button", { name: /delete|confirm/i })
    fireEvent.click(buttons[buttons.length - 1]!)

    await waitFor(() =>
      expect(http.delete).toHaveBeenCalledWith(
        "/overhead-employees/e1",
        expect.anything(),
      ),
    )
  })

  it("hides adding, editing and deleting without those permissions", async () => {
    perms.codes = new Set(["overhead:read"])
    renderPage()
    await screen.findByText("Ahmad Saleh")

    expect(screen.queryByRole("button", { name: "Add employee" })).toBeNull()
    expect(
      screen.queryByRole("button", { name: "Edit Ahmad Saleh" }),
    ).toBeNull()
    expect(
      screen.queryByRole("button", { name: "Delete Ahmad Saleh" }),
    ).toBeNull()
  })
})

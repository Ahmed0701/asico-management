import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/shared/i18n"
import { setAccessToken } from "@/shared/auth/accessToken"
import { downloadExport } from "./downloadExport"
import { ExportProvider } from "./ExportProvider"
import { ListExportMenu } from "./ListExportMenu"

const COLUMNS = ["Villa Number", "Owner Name", "Area", "Progress"]

const fetchMock = vi.fn()

function renderMenu() {
  render(
    <I18nextProvider i18n={i18n}>
      <ExportProvider>
        <ListExportMenu
          total={3}
          onExport={(format, signal) =>
            downloadExport({
              path: "/villas/export",
              query: { block: "B1" },
              format,
              filenameStem: "villas",
              signal,
            })
          }
        />
      </ExportProvider>
    </I18nextProvider>,
  )
}

const urlOf = (call: unknown[]) => new URL(String(call[0]), "http://app.test")

beforeEach(() => {
  localStorage.clear()
  setAccessToken("token")
  fetchMock.mockReset()
  fetchMock.mockImplementation(async (url: string) => {
    if (url.includes("describe=columns")) {
      return new Response(JSON.stringify({ data: { columns: COLUMNS } }), {
        status: 200,
      })
    }
    return new Response(new Blob(["file"]), { status: 200 })
  })
  vi.stubGlobal("fetch", fetchMock)
  URL.createObjectURL = vi.fn(() => "blob:x")
  URL.revokeObjectURL = vi.fn()
})
afterEach(() => vi.unstubAllGlobals())

async function openChooser(item: string) {
  fireEvent.click(screen.getByRole("button", { name: /export list/i }))
  fireEvent.click(await screen.findByRole("menuitem", { name: item }))
  return screen.findByRole("dialog", { name: "Choose the columns to export" })
}

describe("choosing the columns of an export", () => {
  it("lists the file's columns, all ticked, and downloads only the ticked ones, remembering them", async () => {
    renderMenu()
    const dialog = await openChooser("Excel, choose columns…")

    const describe = urlOf(fetchMock.mock.calls[0]!)
    expect(describe.pathname).toBe("/api/v1/villas/export")
    expect(describe.searchParams.get("describe")).toBe("columns")
    expect(describe.searchParams.get("block")).toBe("B1")
    const boxes = within(dialog).getAllByRole("checkbox")
    expect(boxes).toHaveLength(4)
    expect(
      boxes.every((box) => box.getAttribute("data-state") === "checked"),
    ).toBe(true)

    fireEvent.click(within(dialog).getByLabelText("Owner Name"))
    expect(within(dialog).getByText("3 of 4 columns")).toBeTruthy()
    expect(
      within(dialog).getByText(
        "A file without every column cannot be imported back.",
      ),
    ).toBeTruthy()
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Export 3 columns" }),
    )

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    const file = urlOf(fetchMock.mock.calls[1]!)
    expect(file.searchParams.get("format")).toBe("xlsx")
    expect(file.searchParams.get("columns")).toBe("Villa Number,Area,Progress")
    expect(file.searchParams.get("block")).toBe("B1")
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())

    // Next time the same choice is ticked.
    const again = await openChooser("Excel, choose columns…")
    await waitFor(() =>
      expect(within(again).getByText("3 of 4 columns")).toBeTruthy(),
    )
  })

  it("asks for no columns when all are kept, and makes no file when cancelled", async () => {
    renderMenu()
    let dialog = await openChooser("PDF, choose columns…")
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Export 4 columns" }),
    )
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(urlOf(fetchMock.mock.calls[1]!).searchParams.has("columns")).toBe(
      false,
    )
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())

    fetchMock.mockClear()
    dialog = await openChooser("PDF, choose columns…")
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("closes the dialog and makes no file when the export is cancelled while it is open", async () => {
    renderMenu()
    await openChooser("Excel, choose columns…")

    fireEvent.click(screen.getByRole("button", { name: "Cancel export" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole("button", { name: "Cancel export" })).toBeNull()
  })

  it("cannot export with nothing ticked", async () => {
    renderMenu()
    const dialog = await openChooser("Excel, choose columns…")
    fireEvent.click(within(dialog).getByRole("button", { name: "None" }))
    expect(
      within(dialog).getByRole("button", { name: "Export 0 columns" }),
    ).toBeDisabled()
  })

  it("keeps the plain Excel and PDF exports as they were: no question, every column", async () => {
    renderMenu()
    fireEvent.click(screen.getByRole("button", { name: /export list/i }))
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Excel (.xlsx)" }),
    )
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const file = urlOf(fetchMock.mock.calls[0]!)
    expect(file.searchParams.has("describe")).toBe(false)
    expect(file.searchParams.has("columns")).toBe(false)
    expect(screen.queryByRole("dialog")).toBeNull()
  })
})

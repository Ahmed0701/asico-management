import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/shared/i18n"
import type { VariationOrder } from "../api/variation-orders.types"
import VariationOrderFilesModal from "./VariationOrderFilesModal"
import VariationOrderFormModal from "./VariationOrderFormModal"

const http = vi.hoisted(() => ({ post: vi.fn(), delete: vi.fn() }))
vi.mock("@/shared/api/client", async (importActual) => ({
  ...(await importActual<typeof import("@/shared/api/client")>()),
  api: http,
}))

const order: VariationOrder = {
  id: "vo1",
  villaId: "v1",
  voNumber: "VO-7",
  amountMinor: 1500,
  dateAdded: "2026-11-20",
  status: "PENDING",
  notes: null,
  files: [
    {
      id: "f1",
      name: "vo-7.pdf",
      mime: "application/pdf",
      size: 2048,
      uploadedAt: "2026-11-20T09:00:00.000Z",
    },
  ],
  version: 1,
  createdAt: "2026-11-20T09:00:00.000Z",
  updatedAt: "2026-11-20T09:00:00.000Z",
}

const wrap = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
    </QueryClientProvider>,
  )

beforeEach(() => vi.clearAllMocks())

describe("VariationOrderFormModal", () => {
  it("lets someone who may edit choose Pending or Paid", () => {
    wrap(<VariationOrderFormModal open villaId="v1" onClose={() => {}} />)
    expect(screen.getByLabelText("Status")).toBeTruthy()
  })

  it("has no status for an electrical engineer, and hands the new order on to attach its PDF", async () => {
    http.post.mockResolvedValue({ data: { data: order } })
    const onCreated = vi.fn()
    wrap(
      <VariationOrderFormModal
        open
        villaId="v1"
        canSetStatus={false}
        onCreated={onCreated}
        onClose={() => {}}
      />,
    )
    expect(screen.queryByLabelText("Status")).toBeNull()

    fireEvent.change(screen.getByLabelText("VO Number"), {
      target: { value: "VO-7" },
    })
    fireEvent.change(screen.getByLabelText("Amount (KWD)"), {
      target: { value: "1.5" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(order))
    expect(http.post.mock.calls[0]?.[0]).toBe("/villas/v1/variation-orders")
  })
})

describe("VariationOrderFilesModal", () => {
  it("an electrical engineer adds PDF files but does not remove any", () => {
    wrap(
      <VariationOrderFilesModal
        item={order}
        canEdit={false}
        canUpload
        onClose={() => {}}
      />,
    )
    expect(screen.getByRole("button", { name: "Add PDF files" })).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Remove vo-7.pdf" })).toBeNull()
  })
})

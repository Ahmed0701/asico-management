import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/shared/i18n"
import type { VillaImage } from "../api"
import VillaSiteImagesCard from "./VillaSiteImagesCard"

const image = (id: string, name: string): VillaImage => ({
  id,
  villaId: "v1",
  name,
  mime: "image/jpeg",
  size: 2048,
  uploadedBy: { id: "u1", name: "Mona Hassan" },
  uploadedAt: "2026-11-19T08:00:00.000Z",
})
const images = [image("m1", "front.jpg"), image("m2", "roof.jpg")]

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
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

function renderCard() {
  http.get.mockImplementation(async (url: string) => {
    if (url === "/villas/v1/images") return { data: { data: images } }
    return { data: new Blob(["x"], { type: "image/jpeg" }) }
  })
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <I18nextProvider i18n={i18n}>
        <VillaSiteImagesCard villaId="v1" />
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  URL.createObjectURL = vi.fn(() => "blob:local")
  URL.revokeObjectURL = vi.fn()
  perms.codes = new Set([
    "villa-documents:download",
    "villa-documents:upload",
    "villa-documents:delete",
  ])
})

describe("VillaSiteImagesCard", () => {
  it("loads the villa's images when opened, and shows them as tiles", async () => {
    renderCard()
    expect(http.get).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: /Site Images/ }))

    expect(
      await screen.findByRole("button", { name: "Open front.jpg" }),
    ).toBeTruthy()
    expect(screen.getByRole("button", { name: "Open roof.jpg" })).toBeTruthy()
    expect(screen.getByText("2 images")).toBeTruthy()
    expect(http.get).toHaveBeenCalledWith("/villas/v1/images")
    // Each tile fetches its image with the session.
    await waitFor(() =>
      expect(http.get).toHaveBeenCalledWith("/villa-images/m1/file", {
        responseType: "blob",
      }),
    )
  })

  it("uploads the photos picked", async () => {
    renderCard()
    http.post.mockResolvedValue({
      data: { data: [image("m3", "side.png"), ...images] },
    })
    fireEvent.click(screen.getByRole("button", { name: /Site Images/ }))
    await screen.findByRole("button", { name: "Open front.jpg" })

    const photo = new File(["x"], "side.png", { type: "image/png" })
    fireEvent.change(screen.getByTestId("villa-images-input"), {
      target: { files: [photo] },
    })

    await waitFor(() => expect(http.post).toHaveBeenCalled())
    const [url, form] = http.post.mock.calls[0]!
    expect(url).toBe("/villas/v1/images")
    expect(((form as FormData).getAll("file")[0] as File).name).toBe("side.png")
    expect(
      await screen.findByRole("button", { name: "Open side.png" }),
    ).toBeTruthy()
  })

  it("opens an image full size, steps to the next one, and deletes it after confirming", async () => {
    renderCard()
    http.delete.mockResolvedValue({ data: undefined })
    fireEvent.click(screen.getByRole("button", { name: /Site Images/ }))
    fireEvent.click(
      await screen.findByRole("button", { name: "Open front.jpg" }),
    )

    const viewer = await screen.findByRole("dialog")
    expect(within(viewer).getByText(/Added by Mona Hassan/)).toBeTruthy()
    fireEvent.click(within(viewer).getByRole("button", { name: "Next image" }))
    expect(
      await screen.findByRole("heading", { name: "roof.jpg" }),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Delete image" }))
    expect(await screen.findByText(/Delete the image roof.jpg/)).toBeTruthy()
    const confirm = screen.getAllByRole("button", {
      name: /confirm|delete/i,
    })
    fireEvent.click(confirm[confirm.length - 1]!)

    await waitFor(() =>
      expect(http.delete).toHaveBeenCalledWith("/villa-images/m2"),
    )
  })

  it("shows the images without the buttons to add or delete them", async () => {
    perms.codes = new Set(["villa-documents:download"])
    renderCard()
    fireEvent.click(screen.getByRole("button", { name: /Site Images/ }))
    fireEvent.click(
      await screen.findByRole("button", { name: "Open front.jpg" }),
    )

    await screen.findByRole("dialog")
    expect(screen.queryByRole("button", { name: "Add images" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Delete image" })).toBeNull()
  })
})

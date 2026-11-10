import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import i18n from "@/shared/i18n"
import { setAccessToken } from "@/shared/auth/accessToken"
import { server } from "@/test/msw/server"
import SmallWorkFormModal from "./SmallWorkFormModal"

function renderModal() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <I18nextProvider i18n={i18n}>
        <SmallWorkFormModal open onClose={() => {}} onSaved={() => {}} />
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

describe("SmallWorkFormModal", () => {
  it("shows contractor permission message and disables save when options are forbidden", async () => {
    setAccessToken("seed-token")
    server.use(
      http.get("*/villas/options", () =>
        HttpResponse.json({
          data: [{ id: "v1", villaNumber: "V-1" }],
        }),
      ),
      http.get("*/contractors/options", () =>
        HttpResponse.json({ error: { code: "FORBIDDEN", message: "Nope" } }, {
          status: 403,
        }),
      ),
    )
    renderModal()
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /save/i })).toBeDisabled(),
    )
    expect(
      screen.getAllByText(i18n.t("contractors.selectForbidden")).length,
    ).toBeGreaterThan(0)
  })
})

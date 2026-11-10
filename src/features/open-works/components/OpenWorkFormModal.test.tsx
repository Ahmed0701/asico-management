import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import i18n from "@/shared/i18n"
import { setAccessToken } from "@/shared/auth/accessToken"
import { server } from "@/test/msw/server"
import OpenWorkFormModal from "./OpenWorkFormModal"

function renderModal() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <I18nextProvider i18n={i18n}>
        <OpenWorkFormModal open onClose={() => {}} onSaved={() => {}} />
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

describe("OpenWorkFormModal", () => {
  it("shows elec phase permission message and disables save when options are forbidden", async () => {
    setAccessToken("seed-token")
    server.use(
      http.get("*/villas/options", () =>
        HttpResponse.json({
          data: [{ id: "v1", villaNumber: "V-1" }],
        }),
      ),
      http.get("*/elec-phases/options", () =>
        HttpResponse.json({ error: { code: "FORBIDDEN", message: "Nope" } }, {
          status: 403,
        }),
      ),
    )
    renderModal()
    expect(
      await screen.findByText(i18n.t("openWorks.elecPhaseOptionsForbidden")),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled()
  })
})

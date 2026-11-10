import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import i18n from "@/shared/i18n"
import { server } from "@/test/msw/server"
import CivilEngineerSelect from "./CivilEngineerSelect"

function renderSelect(props?: { value?: string }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <I18nextProvider i18n={i18n}>
        <CivilEngineerSelect
          value={props?.value ?? ""}
          onChange={() => {}}
          label="Engineer"
        />
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

describe("CivilEngineerSelect", () => {
  it("shows forbidden message on 403", async () => {
    server.use(
      http.get("/api/v1/civil-engineers/options", () =>
        HttpResponse.json({ code: "FORBIDDEN", message: "Nope" }, {
          status: 403,
        }),
      ),
    )
    renderSelect()
    expect(
      await screen.findByText(i18n.t("engineers.selectForbidden")),
    ).toBeInTheDocument()
  })

  it("disambiguates duplicate names", async () => {
    server.use(
      http.get("/api/v1/civil-engineers/options", () =>
        HttpResponse.json({
          data: [
            { id: "aaaa1111-1111-4111-8111-111111111111", name: "Same" },
            { id: "bbbb2222-2222-4222-8222-222222222222", name: "Same" },
          ],
        }),
      ),
    )
    renderSelect({ value: "aaaa1111-1111-4111-8111-111111111111" })
    // The chosen engineer is shown in the search field itself.
    expect(
      await screen.findByDisplayValue(/Same \(aaaa11…\)/),
    ).toBeInTheDocument()
  })
})

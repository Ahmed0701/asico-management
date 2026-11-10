import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { describe, expect, it } from "vitest"
import i18n from "@/shared/i18n"
import { meQueryKey } from "@/features/auth/api/auth.queries"
import RequirePermission from "./RequirePermission"

function renderGuard(permissions: string[]) {
  const qc = new QueryClient()
  qc.setQueryData(meQueryKey, {
    id: "u1",
    name: "Test",
    email: "t@e.com",
    role: "EMPLOYEE",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    permissions,
  })
  return render(
    <QueryClientProvider client={qc}>
      <I18nextProvider i18n={i18n}>
        <RequirePermission permission="audit:read">
          <p>Secret audit</p>
        </RequirePermission>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

describe("RequirePermission", () => {
  it("blocks without audit:read", () => {
    renderGuard(["villas:read"])
    expect(screen.queryByText("Secret audit")).not.toBeInTheDocument()
    expect(screen.getByText(i18n.t("audit.forbiddenTitle"))).toBeInTheDocument()
  })

  it("allows with audit:read", () => {
    renderGuard(["audit:read"])
    expect(screen.getByText("Secret audit")).toBeInTheDocument()
  })
})

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"
import i18n from "@/shared/i18n"
import { meQueryKey } from "@/features/auth/api/auth.queries"
import CivilEngineersTable from "./CivilEngineersTable"

const xss = "<img src=x onerror=alert(1)>"

describe("CivilEngineersTable", () => {
  it("renders engineer names as literal text", () => {
    const qc = new QueryClient()
    qc.setQueryData(meQueryKey, {
      id: "u1",
      name: "Test",
      email: "t@e.com",
      role: "EMPLOYEE",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      permissions: [],
    })
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <I18nextProvider i18n={i18n}>
            <CivilEngineersTable
              rows={[
                {
                  id: "e1",
                  version: 1,
                  name: xss,
                  phone: "+12345",
                  villaCount: 0,
                  status: "ACTIVE",
                  createdAt: "2026-01-01T00:00:00.000Z",
                  updatedAt: "2026-01-01T00:00:00.000Z",
                },
              ]}
              isLoading={false}
              nameSort="default"
              createdSort="none"
              onToggleNameSort={() => {}}
              onToggleCreatedSort={() => {}}
              canUpdate={false}
              canDelete={false}
              onEdit={() => {}}
              onDelete={() => {}}
              deleteDisabled={() => false}
              deleteDisabledTitle={() => undefined}
            />
          </I18nextProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(document.querySelector("img")).toBeNull()
    expect(screen.getByText(xss)).toBeInTheDocument()
  })
})

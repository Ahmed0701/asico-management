import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { I18nextProvider } from "react-i18next"
import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/shared/i18n"
import { meQueryKey } from "@/features/auth/api/auth.queries"
import { usersKeys } from "@/features/users/api/users.queries"
import { server } from "@/test/msw/server"
import { setAccessToken } from "@/shared/auth/accessToken"
import { toast } from "@/shared/lib/toast"
import ResetUserPasswordDialog from "./ResetUserPasswordDialog"

vi.mock("@/shared/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const target = {
  id: "user-target",
  name: "Target User",
  email: "target@asico.example",
  role: "EMPLOYEE" as const,
}

const meEmployee = {
  id: "emp-1",
  name: "Employee",
  email: "emp@asico.example",
  role: "EMPLOYEE" as const,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  permissions: ["users:update"],
}

function renderDialog(
  qc: QueryClient,
  props?: {
    me?: typeof meEmployee
    target?: typeof target
  },
) {
  const onClose = vi.fn()
  render(
    <QueryClientProvider client={qc}>
      <I18nextProvider i18n={i18n}>
        <ResetUserPasswordDialog
          open
          onClose={onClose}
          target={props?.target ?? target}
          me={props?.me ?? meEmployee}
        />
      </I18nextProvider>
    </QueryClientProvider>,
  )
  return { onClose }
}

describe("ResetUserPasswordDialog", () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear()
    setAccessToken("test-token")
  })

  it("shows confirmation copy with the user email", () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    renderDialog(qc)
    expect(
      screen.getByText(
        i18n.t("users.resetPasswordBody", { email: target.email }),
      ),
    ).toBeInTheDocument()
  })

  it("shows self-reset warning when target is the signed-in user", () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    renderDialog(qc, {
      me: { ...meEmployee, id: target.id },
      target: { ...target, id: target.id },
    })
    expect(
      screen.getByText(i18n.t("users.resetPasswordSelfWarning")),
    ).toBeInTheDocument()
  })

  it("toasts server message and invalidates users queries on success", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      http.post("/api/v1/users/user-target/reset-password", () =>
        HttpResponse.json({
          data: { message: "Reset email sent from server" },
        }),
      ),
    )
    const { onClose } = renderDialog(qc)
    const user = userEvent.setup()
    await user.click(
      screen.getByRole("button", { name: i18n.t("users.resetPasswordAction") }),
    )
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Reset email sent from server",
      ),
    )
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: usersKeys.all })
    expect(onClose).toHaveBeenCalled()
  })

  it("sends one request when confirm is double-clicked", async () => {
    let calls = 0
    server.use(
      http.post("/api/v1/users/user-target/reset-password", async () => {
        calls += 1
        await new Promise((r) => setTimeout(r, 50))
        return HttpResponse.json({
          data: { message: "OK" },
        })
      }),
    )
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    renderDialog(qc)
    const user = userEvent.setup()
    const confirm = screen.getByRole("button", {
      name: i18n.t("users.resetPasswordAction"),
    })
    await user.dblClick(confirm)
    await waitFor(() => expect(toast.success).toHaveBeenCalled())
    expect(calls).toBe(1)
  })

  it("shows email failure copy with retry on 502", async () => {
    let calls = 0
    server.use(
      http.post("/api/v1/users/user-target/reset-password", () => {
        calls += 1
        if (calls === 1) {
          return HttpResponse.json(
            {
              code: "EMAIL_DELIVERY_FAILED",
              message: "SMTP down",
              requestId: "req-502",
            },
            { status: 502 },
          )
        }
        return HttpResponse.json({ data: { message: "Sent on retry" } })
      }),
    )
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    renderDialog(qc)
    const user = userEvent.setup()
    await user.click(
      screen.getByRole("button", { name: i18n.t("users.resetPasswordAction") }),
    )
    expect(
      await screen.findByText(i18n.t("users.resetPasswordEmailFailed")),
    ).toBeInTheDocument()
    expect(screen.getByText("SMTP down")).toBeInTheDocument()
    expect(screen.getByText(/req-502/)).toBeInTheDocument()
    await user.click(
      screen.getByRole("button", { name: i18n.t("common.retry") }),
    )
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Sent on retry"),
    )
    expect(calls).toBe(2)
  })

  it("refetches me on 403", async () => {
    const qc = qcWithMe()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    server.use(
      http.post("/api/v1/users/user-target/reset-password", () =>
        HttpResponse.json({ code: "FORBIDDEN", message: "Denied" }, {
          status: 403,
        }),
      ),
    )
    renderDialog(qc)
    const user = userEvent.setup()
    await user.click(
      screen.getByRole("button", { name: i18n.t("users.resetPasswordAction") }),
    )
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: meQueryKey }),
    )
  })

  it("shows friendly message on 429", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    server.use(
      http.post("/api/v1/users/user-target/reset-password", () =>
        HttpResponse.json(
          { code: "TOO_MANY_REQUESTS", message: "Rate limited" },
          { status: 429 },
        ),
      ),
    )
    renderDialog(qc)
    const user = userEvent.setup()
    await user.click(
      screen.getByRole("button", { name: i18n.t("users.resetPasswordAction") }),
    )
    expect(
      await screen.findByText(i18n.t("users.resetPasswordTooManyRequests")),
    ).toBeInTheDocument()
  })

  it("shows not found with request id on 404", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    server.use(
      http.post("/api/v1/users/user-target/reset-password", () =>
        HttpResponse.json(
          {
            code: "USER_NOT_FOUND",
            message: "User missing",
            requestId: "req-404",
          },
          { status: 404 },
        ),
      ),
    )
    renderDialog(qc)
    const user = userEvent.setup()
    await user.click(
      screen.getByRole("button", { name: i18n.t("users.resetPasswordAction") }),
    )
    expect(await screen.findByText("User missing")).toBeInTheDocument()
    expect(screen.getByText(/req-404/)).toBeInTheDocument()
  })
})

function qcWithMe() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  qc.setQueryData(meQueryKey, meEmployee)
  return qc
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"
import { I18nextProvider } from "react-i18next"
import i18n from "@/shared/i18n"
import LoginPage from "./LoginPage"

function renderLogin() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

describe("LoginPage", () => {
  it("signs in successfully", async () => {
    renderLogin()
    const user = userEvent.setup({ delay: null })
    await user.type(screen.getByLabelText(/email/i), "test@asico.example")
    await user.type(screen.getByLabelText(/^password/i), "valid-password")
    await user.click(screen.getByRole("button", { name: /sign in/i }))
    await waitFor(
      () => expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
      { timeout: 10_000 },
    )
  }, 15_000)

  it("shows invalid credentials message", async () => {
    renderLogin()
    const user = userEvent.setup({ delay: null })
    await user.type(screen.getByLabelText(/email/i), "test@asico.example")
    await user.type(screen.getByLabelText(/^password/i), "wrong")
    await user.click(screen.getByRole("button", { name: /sign in/i }))
    expect(await screen.findByRole("alert")).toHaveTextContent(
      i18n.t("auth.invalidCredentials"),
    )
  })

  it("shows inactive account message", async () => {
    renderLogin()
    const user = userEvent.setup({ delay: null })
    await user.type(screen.getByLabelText(/email/i), "inactive@asico.example")
    await user.type(screen.getByLabelText(/^password/i), "valid-password")
    await user.click(screen.getByRole("button", { name: /sign in/i }))
    expect(await screen.findByRole("alert")).toHaveTextContent(
      i18n.t("auth.accountInactive"),
    )
  }, 15_000)
})

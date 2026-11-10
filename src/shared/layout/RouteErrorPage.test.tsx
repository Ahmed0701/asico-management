import { render, screen } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { createMemoryRouter, Outlet, RouterProvider } from "react-router"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/shared/i18n"
import RouteErrorPage from "./RouteErrorPage"

beforeAll(async () => {
  await i18n.changeLanguage("en")
})

function Boom(): never {
  throw new Error("kaboom")
}

function renderAt(
  path: string,
  routes: Parameters<typeof createMemoryRouter>[0],
) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(
    <I18nextProvider i18n={i18n}>
      <RouterProvider router={router} />
    </I18nextProvider>,
  )
}

describe("RouteErrorPage", () => {
  it("shows the error card instead of a blank page when a page throws, and keeps the layout around it", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    renderAt("/broken", [
      {
        path: "/",
        element: (
          <div>
            <nav>Sidebar</nav>
            <Outlet />
          </div>
        ),
        children: [
          {
            ErrorBoundary: RouteErrorPage,
            children: [{ path: "broken", Component: Boom }],
          },
        ],
      },
    ])

    expect(screen.getByRole("alert")).toBeInTheDocument()
    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Go to dashboard" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Sidebar")).toBeInTheDocument()
  })

  it("says the page was not found for a 404 route error, with no retry", () => {
    renderAt("/missing", [
      { path: "/", element: <p>home</p>, ErrorBoundary: RouteErrorPage },
    ])

    expect(screen.getByText("Page not found")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Try again" }),
    ).not.toBeInTheDocument()
  })
})

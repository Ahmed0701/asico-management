import { RouterProvider } from "react-router"
import Providers from "./app/providers"
import { router } from "./app/router"
import AppErrorBoundary from "./shared/layout/AppErrorBoundary"

export default function App() {
  return (
    <AppErrorBoundary>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </AppErrorBoundary>
  )
}

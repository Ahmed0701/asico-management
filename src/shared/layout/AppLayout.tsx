import { Outlet, ScrollRestoration } from "react-router"
import SessionExpiredRedirect from "@/features/auth/components/SessionExpiredRedirect"
import Header from "./Header"
import Sidebar from "./Sidebar"

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <SessionExpiredRedirect />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <ScrollRestoration />
    </div>
  )
}

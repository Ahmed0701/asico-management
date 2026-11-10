import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useState, type ReactNode } from "react"
import { ensureAuthRefreshBroadcast } from "@/shared/auth/authRefreshBroadcast"
import { bootstrapSession } from "../api/auth.queries"
import FullPageLoader from "./FullPageLoader"

export default function SessionBootstrap({
  children,
}: {
  children: ReactNode
}) {
  const queryClient = useQueryClient()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ensureAuthRefreshBroadcast()
    void import("@/shared/auth/proactiveAccessRefresh").then((m) =>
      m.ensureProactiveAccessRefreshListeners(),
    )
    void bootstrapSession(queryClient).finally(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [queryClient])

  if (!ready) return <FullPageLoader />
  return children
}

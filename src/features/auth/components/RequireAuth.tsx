import { useEffect, useRef, useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router"
import { refreshAccessToken } from "@/shared/api/refreshAccessToken"
import { toApiError } from "@/shared/api/client"
import { getAccessToken } from "@/shared/auth/accessToken"
import { useMeQuery } from "../api/auth.queries"

export default function RequireAuth() {
  const location = useLocation()
  const token = getAccessToken()
  const { data: me, isFetching, isError, error, refetch } = useMeQuery()
  const [recoveryReady, setRecoveryReady] = useState(false)
  const recoveryAttempted = useRef(false)

  useEffect(() => {
    if (recoveryAttempted.current) return

    const me401 = isError && error && toApiError(error).status === 401
    const needsRecovery = !token || me401

    if (!needsRecovery) {
      recoveryAttempted.current = true
      setRecoveryReady(true)
      return
    }

    recoveryAttempted.current = true
    void refreshAccessToken({ notifyExpiry: false }).then((refreshed) => {
      if (refreshed) {
        void refetch()
      }
      setRecoveryReady(true)
    })
  }, [token, isError, error, refetch])

  if (!recoveryReady) {
    return null
  }

  const currentToken = getAccessToken()
  if (!currentToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (isFetching && !me) {
    return null
  }

  if (isError || !me) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

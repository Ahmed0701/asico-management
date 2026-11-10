import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useNavigate } from "react-router"
import { registerSessionExpiredHandler } from "@/shared/auth/sessionLifecycle"
import { meQueryKey } from "../api/auth.queries"

export default function SessionExpiredRedirect() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    return registerSessionExpiredHandler(() => {
      queryClient.setQueryData(meQueryKey, undefined)
      queryClient.removeQueries({ queryKey: meQueryKey })
      navigate("/login", { replace: true })
    })
  }, [navigate, queryClient])

  return null
}

import { Navigate, useLocation } from "react-router"

export default function AuditLogRedirect() {
  const { search } = useLocation()
  return <Navigate to={`/audit${search}`} replace />
}

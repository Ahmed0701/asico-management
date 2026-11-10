import RequirePermission from "@/features/auth/components/RequirePermission"
import MewFollowUpPage from "./MewFollowUpPage"

export default function MewFollowUpRoute() {
  return (
    <RequirePermission permission="villas:read">
      <MewFollowUpPage />
    </RequirePermission>
  )
}

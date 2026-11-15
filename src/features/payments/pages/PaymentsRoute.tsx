import RequirePermission from "@/features/auth/components/RequirePermission"
import PaymentsPage from "./PaymentsPage"

/** The payments to contractors. */
export default function PaymentsRoute() {
  return (
    <RequirePermission permission="payments:read">
      <PaymentsPage />
    </RequirePermission>
  )
}

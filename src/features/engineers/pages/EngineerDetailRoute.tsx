import RequirePermission from "@/features/auth/components/RequirePermission"
import EngineerDetailPage from "./EngineerDetailPage"

export default function EngineerDetailRoute() {
  return (
    <RequirePermission permission="civil-engineers:read">
      <EngineerDetailPage />
    </RequirePermission>
  )
}

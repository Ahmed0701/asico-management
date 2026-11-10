import RequirePermission from "@/features/auth/components/RequirePermission"
import ContractorDetailPage from "./ContractorDetailPage"

export default function ContractorDetailRoute() {
  return (
    <RequirePermission permission="contractors:read">
      <ContractorDetailPage />
    </RequirePermission>
  )
}

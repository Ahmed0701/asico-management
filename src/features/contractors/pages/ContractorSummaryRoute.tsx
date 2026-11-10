import RequirePermission from "@/features/auth/components/RequirePermission"
import ContractorSummaryPage from "./ContractorSummaryPage"

export default function ContractorSummaryRoute() {
  return (
    <RequirePermission permission="contractors:summary">
      <ContractorSummaryPage />
    </RequirePermission>
  )
}

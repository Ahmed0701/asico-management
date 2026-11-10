import RequirePermission from "@/features/auth/components/RequirePermission"
import ContractorsPage from "./ContractorsPage"

export default function ContractorsRoute() {
  return (
    <RequirePermission permission="contractors:read">
      <ContractorsPage />
    </RequirePermission>
  )
}

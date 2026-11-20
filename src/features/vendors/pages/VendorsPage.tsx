import { useState } from "react"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import FactoriesModal from "@/features/materials/components/FactoriesModal"
import Button from "@/shared/ui/Button"
import PageHeader from "@/shared/ui/PageHeader"
import VillaVendorsPanel from "../components/VillaVendorsPanel"

/** The Vendors: assign each villa its switchgear factory and its cable factory, and keep the list of factories. */
export default function VendorsPage() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const [factoriesOpen, setFactoriesOpen] = useState(false)

  return (
    <>
      <PageHeader
        title={t("vendors.title")}
        subtitle={t("vendors.subtitle")}
        actions={
          <Button
            type="button"
            size="sm"
            icon="hardhat"
            onClick={() => setFactoriesOpen(true)}
          >
            {t("materials.factories")}
          </Button>
        }
      />
      <VillaVendorsPanel />
      <FactoriesModal
        open={factoriesOpen}
        canEdit={can("materials:update")}
        onClose={() => setFactoriesOpen(false)}
      />
    </>
  )
}

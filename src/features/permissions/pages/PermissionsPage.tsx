import { useTranslation } from "react-i18next"
import Button from "@/shared/ui/Button"
import PageHeader from "@/shared/ui/PageHeader"
import { PermissionCatalogCards } from "../components/PermissionCatalogCards"
import { PermissionCatalogLoading } from "../components/PermissionCatalogLoading"
import { usePermissionCatalogQuery } from "../api"

export default function PermissionsPage() {
  const { t } = useTranslation()
  const {
    data: catalog,
    isLoading,
    isError,
    refetch,
  } = usePermissionCatalogQuery()

  return (
    <>
      <PageHeader
        title={t("permissions.title")}
        subtitle={t("permissions.subtitleCatalog")}
      />
      {isLoading && <PermissionCatalogLoading />}
      {isError && !isLoading && (
        <>
          <p className="text-sm text-danger">{t("permissions.errorBody")}</p>
          <Button className="mt-2" onClick={() => void refetch()}>
            {t("common.retry")}
          </Button>
        </>
      )}
      {catalog && !isLoading && !isError && (
        <PermissionCatalogCards catalog={catalog} />
      )}
    </>
  )
}

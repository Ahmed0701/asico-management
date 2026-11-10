import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import { formatDateTime } from "@/shared/lib/format"
import Button from "@/shared/ui/Button"
import PageHeader from "@/shared/ui/PageHeader"
import { useDashboardSummaryQuery } from "../api"
import DashboardSummarySection from "../components/DashboardSummarySection"

export default function DashboardPage() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const canVillasRead = can("villas:read")
  const canContractorsRead = can("contractors:read")

  const summaryQuery = useDashboardSummaryQuery()

  const updatedLabel =
    summaryQuery.data?.generatedAt &&
    t("dashboard.updatedAt", {
      time: formatDateTime(summaryQuery.data.generatedAt),
    })

  return (
    <>
      <PageHeader
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="shrink-0"
              disabled={summaryQuery.isFetching}
              onClick={() => void summaryQuery.refetch()}
            >
              {t("dashboard.refresh")}
            </Button>
            {updatedLabel && (
              <p className="min-w-0 text-xs text-muted-foreground">
                {updatedLabel}
              </p>
            )}
          </div>
        }
      />

      <DashboardSummarySection
        query={summaryQuery}
        canVillasRead={canVillasRead}
        canContractorsRead={canContractorsRead}
      />
    </>
  )
}

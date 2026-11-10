import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import {
  buildDailyLabourListQueryParams,
  useDailyLabourListParams,
  useSiteReportsPageTab,
} from "@/features/daily-labour/api"
import {
  buildSiteReportsListQueryParams,
  useSiteReportsListParams,
} from "../api"
import { invalidateDailyLabourAfterWrite } from "@/features/daily-labour/lib/dailyLabourQueryCache"
import { invalidateSiteReportsAfterWrite } from "../lib/siteReportsQueryCache"
import { downloadExport } from "@/shared/export/downloadExport"
import { ImportWizardModal, IMPORT_RESOURCES } from "@/shared/import"
import ListPageHeaderActions from "@/shared/list/ListPageHeaderActions"
import PageHeader from "@/shared/ui/PageHeader"
import Tabs from "@/shared/ui/Tabs"
import DailyLabourTabPanel, {
  useDailyLabourTabListMeta,
} from "./DailyLabourTabPanel"
import SiteReportsTabPanel, {
  useSiteReportsTabListMeta,
} from "./SiteReportsTabPanel"

export default function SiteReportsPage() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const qc = useQueryClient()
  const { tab, setTab } = useSiteReportsPageTab()
  const canLabourRead = can("daily-labour:read")

  const { params: reportListParams } = useSiteReportsListParams()
  const { params: labourListParams } = useDailyLabourListParams()
  const reportsMeta = useSiteReportsTabListMeta()
  const labourMeta = useDailyLabourTabListMeta()

  const [importOpen, setImportOpen] = useState(false)
  const [savedBanner, setSavedBanner] = useState(false)
  const [reportsCreateSignal, setReportsCreateSignal] = useState(0)
  const [labourCreateSignal, setLabourCreateSignal] = useState(0)

  useEffect(() => {
    if (tab === "labour" && !canLabourRead) {
      setTab("reports")
    }
  }, [tab, canLabourRead, setTab])

  const isLabourTab = tab === "labour" && canLabourRead

  const canReportsCreate = can("site-reports:create")
  const canReportsExport = can("site-reports:export")
  const canReportsImport = can("site-reports:import")
  const canLabourCreate = can("daily-labour:create")
  const canLabourExport = can("daily-labour:export")
  const canLabourImport = can("daily-labour:import")

  const onExportReports = useCallback(
    async (format: "xlsx" | "pdf", signal: AbortSignal) => {
      await downloadExport({
        path: "/site-reports/export",
        query: buildSiteReportsListQueryParams(reportListParams, {
          forExport: true,
        }),
        format,
        filenameStem: "site-reports",
        signal,
      })
    },
    [reportListParams],
  )

  const onExportLabour = useCallback(
    async (format: "xlsx" | "pdf", signal: AbortSignal) => {
      await downloadExport({
        path: "/daily-labour/export",
        query: buildDailyLabourListQueryParams(labourListParams, {
          forExport: true,
        }),
        format,
        filenameStem: "daily-labour",
        signal,
      })
    },
    [labourListParams],
  )

  const headerActions = isLabourTab ? (
    canLabourCreate || canLabourExport || canLabourImport ? (
      <ListPageHeaderActions
        showImport={canLabourImport}
        importLabel={t("dailyLabour.import")}
        importAction={
          canLabourImport
            ? {
                kind: "button",
                label: t("dailyLabour.import"),
                onClick: () => setImportOpen(true),
              }
            : undefined
        }
        exportAction={
          canLabourExport
            ? {
                kind: "menu",
                total: labourMeta.total,
                listLoading: labourMeta.isLoading,
                onExport: onExportLabour,
              }
            : undefined
        }
        add={
          canLabourCreate
            ? {
                label: t("dailyLabour.addTitle"),
                onClick: () => setLabourCreateSignal((n) => n + 1),
              }
            : undefined
        }
      />
    ) : undefined
  ) : canReportsCreate || canReportsExport || canReportsImport ? (
    <ListPageHeaderActions
      showImport={canReportsImport}
      importLabel={t("siteReports.import")}
      importAction={
        canReportsImport
          ? {
              kind: "button",
              label: t("siteReports.import"),
              onClick: () => setImportOpen(true),
            }
          : undefined
      }
      exportAction={
        canReportsExport
          ? {
              kind: "menu",
              total: reportsMeta.total,
              listLoading: reportsMeta.isLoading,
              onExport: onExportReports,
            }
          : undefined
      }
      add={
        canReportsCreate
          ? {
              label: t("siteReports.addTitle"),
              onClick: () => setReportsCreateSignal((n) => n + 1),
            }
          : undefined
      }
    />
  ) : undefined

  return (
    <>
      <PageHeader
        title={t("siteReports.title")}
        subtitle={t("siteReports.subtitle")}
        actions={headerActions}
      />
      {savedBanner && (
        <p className="mb-3 rounded-lg bg-closed-soft px-3 py-2 text-sm text-closed">
          {t("common.saved")}
        </p>
      )}
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "reports", label: t("siteReports.tabReports") },
          ...(canLabourRead
            ? [{ id: "labour" as const, label: t("siteReports.tabLabour") }]
            : []),
        ]}
      />
      {isLabourTab ? (
        <DailyLabourTabPanel
          onSavedBanner={() => setSavedBanner(true)}
          openCreateSignal={labourCreateSignal}
        />
      ) : (
        <SiteReportsTabPanel
          onSavedBanner={() => setSavedBanner(true)}
          openCreateSignal={reportsCreateSignal}
        />
      )}
      <ImportWizardModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        config={
          isLabourTab
            ? IMPORT_RESOURCES["daily-labour"]
            : IMPORT_RESOURCES["site-reports"]
        }
        onSuccess={() =>
          isLabourTab
            ? invalidateDailyLabourAfterWrite(qc)
            : invalidateSiteReportsAfterWrite(qc)
        }
      />
    </>
  )
}

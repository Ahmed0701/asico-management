import { useCallback, useMemo, useState } from "react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import SiteReportFormModal from "@/features/site-reports/components/SiteReportFormModal"
import SiteReportsTable from "@/features/site-reports/components/SiteReportsTable"
import {
  buildSiteReportsListQueryParams,
  useDeleteSiteReportMutation,
  useSiteReportsListQuery,
  type SiteReport,
  type SiteReportsListParams,
} from "@/features/site-reports/api"
import { invalidateSiteReportsAfterWrite } from "@/features/site-reports/lib/siteReportsQueryCache"
import { toApiError } from "@/shared/api/errors"
import { downloadExport } from "@/shared/export/downloadExport"
import VillaResourceTabToolbar from "@/shared/list/VillaResourceTabToolbar"
import { IMPORT_RESOURCES } from "@/shared/import"
import { SearchInput } from "@/shared/ui/Field"
import { ConfirmModal } from "@/shared/ui/Modal"
import { toast } from "@/shared/lib/toast"
import { useQueryClient } from "@tanstack/react-query"
import { formatCalendarDateUtc } from "@/shared/lib/formatCalendarDateUtc"

export default function VillaDetailSiteReportsPanel({
  villaId,
}: {
  villaId: string
}) {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | undefined>()
  const [deleting, setDeleting] = useState<SiteReport | null>(null)
  const remove = useDeleteSiteReportMutation()

  const listParams = useMemo<SiteReportsListParams>(
    () => ({
      page: 1,
      limit: 100,
      villaId,
      search: search.trim() || undefined,
    }),
    [villaId, search],
  )

  const { data, isLoading, refetch } = useSiteReportsListQuery(listParams)
  const rows = data?.data ?? []
  const total = data?.meta.total

  const canCreate = can("site-reports:create")
  const canUpdate = can("site-reports:update")
  const canDelete = can("site-reports:delete")
  const canExport = can("site-reports:export")
  const canImport = can("site-reports:import")

  const onExport = useCallback(
    async (format: "xlsx" | "pdf", signal: AbortSignal) => {
      await downloadExport({
        path: "/site-reports/export",
        query: buildSiteReportsListQueryParams(listParams, {
          forExport: true,
        }),
        format,
        filenameStem: "site-reports",
        signal,
      })
    },
    [listParams],
  )

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync({
        id: deleting.id,
        villaId: deleting.villa.id,
        write: { ifMatch: deleting.version },
      })
      setDeleting(null)
      void refetch()
    } catch (err) {
      toast.error(toApiError(err).message)
    }
  }

  const deleteDateLabel = deleting
    ? formatCalendarDateUtc(`${deleting.visitDate}T00:00:00.000Z`)
    : ""

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 lg:max-w-md">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t("villas.siteReportsSearchPlaceholder")}
          />
        </div>
        <VillaResourceTabToolbar
          canImport={canImport}
          canExport={canExport}
          importLabel={t("siteReports.import")}
          importConfig={IMPORT_RESOURCES["site-reports"]}
          onImportSuccess={() => invalidateSiteReportsAfterWrite(qc, villaId)}
          exportTotal={total}
          exportLoading={isLoading}
          onExport={onExport}
          add={
            canCreate
              ? {
                  label: t("siteReports.addTitle"),
                  onClick: () => {
                    setEditId(undefined)
                    setFormOpen(true)
                  },
                }
              : undefined
          }
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {t("villas.siteReportsFullListHint")}{" "}
        <Link to="/site-reports" className="text-accent hover:underline">
          {t("nav.siteReports")}
        </Link>
      </p>
      <SiteReportsTable
        rows={rows}
        isLoading={isLoading}
        sort=""
        onToggleSort={() => {}}
        showVillaColumn={false}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onEdit={(row) => {
          setEditId(row.id)
          setFormOpen(true)
        }}
        onDelete={setDeleting}
        emptyMessage={t("villas.siteReportsEmpty")}
      />
      <SiteReportFormModal
        open={formOpen}
        reportId={editId}
        defaultVillaId={villaId}
        onClose={() => setFormOpen(false)}
        onSaved={() => void refetch()}
      />
      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void handleDelete()}
        closeOnConfirm={false}
        confirmPending={remove.isPending}
        title={t("siteReports.deleteTitle")}
        message={t("siteReports.deleteBody", {
          date: deleteDateLabel,
          title: deleting?.title ?? "",
        })}
      />
    </div>
  )
}

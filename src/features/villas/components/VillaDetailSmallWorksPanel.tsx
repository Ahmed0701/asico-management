import { useCallback, useMemo, useState } from "react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { usePermissions } from "@/features/auth/api"
import SmallWorkFormModal from "@/features/small-works/components/SmallWorkFormModal"
import SmallWorksTable from "@/features/small-works/components/SmallWorksTable"
import {
  buildSmallWorksListQueryParams,
  useDeleteSmallWorkMutation,
  useSmallWorksListQuery,
  type SmallWork,
  type SmallWorksListParams,
} from "@/features/small-works/api"
import { invalidateSmallWorksAfterWrite } from "@/features/small-works/lib/smallWorksQueryCache"
import { toApiError } from "@/shared/api/errors"
import { downloadExport } from "@/shared/export/downloadExport"
import VillaResourceTabToolbar from "@/shared/list/VillaResourceTabToolbar"
import { IMPORT_RESOURCES } from "@/shared/import"
import { SearchInput } from "@/shared/ui/Field"
import { ConfirmModal } from "@/shared/ui/Modal"
import { toast } from "@/shared/lib/toast"
import { formatCalendarDateUtc } from "@/shared/lib/formatCalendarDateUtc"

export default function VillaDetailSmallWorksPanel({
  villaId,
  highlightSmallWorkId,
}: {
  villaId: string
  highlightSmallWorkId?: string
}) {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | undefined>()
  const [deleting, setDeleting] = useState<SmallWork | null>(null)
  const remove = useDeleteSmallWorkMutation()

  const listParams = useMemo<SmallWorksListParams>(
    () => ({
      page: 1,
      limit: 100,
      villaId,
      search: search.trim() || undefined,
    }),
    [villaId, search],
  )

  const { data, isLoading, refetch } = useSmallWorksListQuery(listParams)
  const rows = data?.data ?? []
  const total = data?.meta.total

  const canCreate = can("small-works:create")
  const canUpdate = can("small-works:update")
  const canDelete = can("small-works:delete")
  const canExport = can("small-works:export")
  const canImport = can("small-works:import")

  const onExport = useCallback(
    async (format: "xlsx" | "pdf", signal: AbortSignal) => {
      await downloadExport({
        path: "/small-works/export",
        query: buildSmallWorksListQueryParams(listParams, { forExport: true }),
        format,
        filenameStem: "small-works",
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
    ? formatCalendarDateUtc(`${deleting.endDate}T00:00:00.000Z`)
    : ""

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 lg:max-w-md">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t("villas.smallWorksSearchPlaceholder")}
          />
        </div>
        <VillaResourceTabToolbar
          canImport={canImport}
          canExport={canExport}
          importLabel={t("smallWorks.import")}
          importConfig={IMPORT_RESOURCES["small-works"]}
          onImportSuccess={() => invalidateSmallWorksAfterWrite(qc, villaId)}
          exportTotal={total}
          exportLoading={isLoading}
          onExport={onExport}
          add={
            canCreate
              ? {
                  label: t("smallWorks.addTitle"),
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
        {t("villas.smallWorksFullListHint")}{" "}
        <Link to="/small-works" className="text-accent hover:underline">
          {t("nav.smallWorks")}
        </Link>
      </p>
      <SmallWorksTable
        rows={rows}
        isLoading={isLoading}
        sort=""
        onToggleSort={() => {}}
        showVillaColumn={false}
        highlightRowId={highlightSmallWorkId}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onEdit={(row) => {
          setEditId(row.id)
          setFormOpen(true)
        }}
        onDelete={setDeleting}
        emptyMessage={t("villas.smallWorksEmpty")}
      />
      <SmallWorkFormModal
        open={formOpen}
        workId={editId}
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
        title={t("smallWorks.deleteTitle")}
        message={t("smallWorks.deleteBody", {
          date: deleteDateLabel,
          description: deleting?.description ?? "",
        })}
      />
    </div>
  )
}

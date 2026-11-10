import { useCallback, useMemo, useState } from "react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { usePermissions } from "@/features/auth/api"
import { toApiError } from "@/shared/api/errors"
import OpenWorkFormModal from "@/features/open-works/components/OpenWorkFormModal"
import OpenWorksTable from "@/features/open-works/components/OpenWorksTable"
import {
  buildOpenWorksListQueryParams,
  useDeleteOpenWorkMutation,
  useOpenWorksListQuery,
  type OpenWork,
  type OpenWorksListParams,
} from "@/features/open-works/api"
import { invalidateOpenWorksAfterWrite } from "@/features/open-works/lib/openWorksQueryCache"
import { downloadExport } from "@/shared/export/downloadExport"
import VillaResourceTabToolbar from "@/shared/list/VillaResourceTabToolbar"
import { IMPORT_RESOURCES } from "@/shared/import"
import { SearchInput } from "@/shared/ui/Field"
import { ConfirmModal } from "@/shared/ui/Modal"
import { toast } from "@/shared/lib/toast"

export default function VillaDetailOpenWorksPanel({
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
  const [deleting, setDeleting] = useState<OpenWork | null>(null)
  const remove = useDeleteOpenWorkMutation()

  const listParams = useMemo<OpenWorksListParams>(
    () => ({
      page: 1,
      limit: 100,
      villaId,
      search: search.trim() || undefined,
    }),
    [villaId, search],
  )

  const { data, isLoading, refetch } = useOpenWorksListQuery(listParams)
  const rows = data?.data ?? []
  const total = data?.meta.total

  const canCreate = can("open-works:create")
  const canUpdate = can("open-works:update")
  const canDelete = can("open-works:delete")
  const canExport = can("open-works:export")
  const canImport = can("open-works:import")

  const onExport = useCallback(
    async (format: "xlsx" | "pdf", signal: AbortSignal) => {
      await downloadExport({
        path: "/open-works/export",
        query: buildOpenWorksListQueryParams(listParams, { forExport: true }),
        format,
        filenameStem: "open-works",
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
      const parsed = toApiError(err)
      toast.error(parsed.message)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 lg:max-w-md">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t("villas.openWorksSearchPlaceholder")}
          />
        </div>
        <VillaResourceTabToolbar
          canImport={canImport}
          canExport={canExport}
          importLabel={t("openWorks.import")}
          importConfig={IMPORT_RESOURCES["open-works"]}
          onImportSuccess={() => invalidateOpenWorksAfterWrite(qc, villaId)}
          exportTotal={total}
          exportLoading={isLoading}
          onExport={onExport}
          add={
            canCreate
              ? {
                  label: t("openWorks.addTitle"),
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
        {t("villas.openWorksFullListHint")}{" "}
        <Link to="/villas/open-works" className="text-accent hover:underline">
          {t("nav.villaOpenWorks")}
        </Link>
      </p>
      <OpenWorksTable
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
        emptyMessage={t("villas.openWorksEmpty")}
      />
      <OpenWorkFormModal
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
        title={t("openWorks.deleteTitle")}
        message={t("openWorks.deleteBody", {
          phase: deleting?.elecPhase.name ?? "",
        })}
      />
    </div>
  )
}

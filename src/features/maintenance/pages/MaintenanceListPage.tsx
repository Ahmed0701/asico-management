import { useState } from "react"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import VillasListFooter from "@/features/villas/components/VillasListFooter"
import { toApiError } from "@/shared/api/errors"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import { normalizeSearchInput } from "@/shared/lib/phone/phoneNormalize"
import { formatDateTime } from "@/shared/lib/format"
import { formatCalendarDateUtc } from "@/shared/lib/formatCalendarDateUtc"
import { toast } from "@/shared/lib/toast"
import Button, { IconButton } from "@/shared/ui/Button"
import { Checkbox } from "@/shared/ui/checkbox"
import { SearchInput } from "@/shared/ui/Field"
import { TableBodySkeleton } from "@/shared/ui/loading-skeletons"
import { ConfirmModal } from "@/shared/ui/Modal"
import PageHeader from "@/shared/ui/PageHeader"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import {
  useDeleteMaintenanceMutation,
  useMaintenanceListParams,
  useMaintenanceListQuery,
  useUpdateMaintenanceMutation,
  type MaintenanceVilla,
} from "../api"
import MaintenanceFormModal from "../components/MaintenanceFormModal"

const day = (value: string) => formatCalendarDateUtc(`${value}T00:00:00.000Z`)

/**
 * The maintenance villas: the open ones (`solved` false) or the solved ones. Checking "Solved" moves a villa to the
 * solved page; unchecking it there moves it back.
 */
export default function MaintenanceListPage({ solved }: { solved: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { can } = usePermissions()
  const canCreate = can("maintenance:create")
  const canUpdate = can("maintenance:update")
  const canDelete = can("maintenance:delete")
  const { params, setParam, setPage, setLimit } =
    useMaintenanceListParams(solved)
  const { data, isLoading, isError, error, refetch } =
    useMaintenanceListQuery(params)
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setParam,
    normalizeSearchInput,
  )
  const update = useUpdateMaintenanceMutation()
  const remove = useDeleteMaintenanceMutation()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<MaintenanceVilla | undefined>()
  const [deleting, setDeleting] = useState<MaintenanceVilla | null>(null)

  const columnCount = (solved ? 7 : 6) + (canUpdate || canDelete ? 1 : 0)

  // Checked on the open list: solved, so it moves to the solved page. Unchecked there: back to the open list.
  const toggleSolved = async (row: MaintenanceVilla, next: boolean) => {
    setBusyId(row.id)
    try {
      await update.mutateAsync({
        id: row.id,
        input: { solved: next },
        write: { ifMatch: row.version },
      })
      toast.success(
        t(next ? "maintenance.movedToSolved" : "maintenance.movedBack", {
          name: row.villaNumber,
        }),
      )
    } catch (err) {
      toast.error(toApiError(err).message)
      void refetch()
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync({ id: deleting.id, version: deleting.version })
      toast.success(t("maintenance.deleted", { name: deleting.villaNumber }))
    } catch (err) {
      toast.error(toApiError(err).message)
      void refetch()
    } finally {
      setDeleting(null)
    }
  }

  const rows = data?.data ?? []
  const meta = data?.meta
  const apiError = isError ? toApiError(error) : null

  return (
    <>
      <PageHeader
        title={t(solved ? "maintenance.solvedTitle" : "maintenance.title")}
        subtitle={t(
          solved ? "maintenance.solvedSubtitle" : "maintenance.subtitle",
        )}
        actions={
          <div className="flex flex-wrap gap-2">
            {solved ? (
              <Button
                type="button"
                size="sm"
                icon="hardhat"
                onClick={() => navigate("/maintenance")}
              >
                {t("maintenance.title")}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  icon="check"
                  onClick={() => navigate("/maintenance/solved")}
                >
                  {t("maintenance.solvedTitle")}
                </Button>
                {canCreate && (
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    icon="plus"
                    onClick={() => {
                      setEditing(undefined)
                      setFormOpen(true)
                    }}
                  >
                    {t("maintenance.add")}
                  </Button>
                )}
              </>
            )}
          </div>
        }
      />
      <div className="mb-3">
        <SearchInput
          value={searchDraft}
          onChange={setSearchDraft}
          placeholder={t("maintenance.searchPlaceholder")}
        />
      </div>
      {apiError && (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {apiError.message}
        </p>
      )}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <TableHead className="px-4 py-2.5">
                {t("maintenance.villaNumber")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("maintenance.location")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("maintenance.handoverDate")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("maintenance.issue")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("maintenance.solved")}
              </TableHead>
              {solved && (
                <TableHead className="px-4 py-2.5">
                  {t("maintenance.solvedAt")}
                </TableHead>
              )}
              <TableHead className="px-4 py-2.5">
                {t("maintenance.addedAt")}
              </TableHead>
              {(canUpdate || canDelete) && (
                <TableHead className="px-4 py-2.5">
                  <span className="sr-only">{t("common.actions")}</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && rows.length === 0 ? (
              <TableBodySkeleton columns={columnCount} rows={8} />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  {t(solved ? "maintenance.solvedEmpty" : "maintenance.empty")}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/40">
                  <TableCell className="px-4 py-3 font-medium tabular-nums">
                    {row.villaNumber}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm" dir="auto">
                    {row.location}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm tabular-nums">
                    {day(row.handoverDate)}
                  </TableCell>
                  <TableCell
                    className="max-w-xs whitespace-pre-wrap px-4 py-3 text-sm"
                    dir="auto"
                  >
                    {row.issue}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Checkbox
                      checked={row.solved}
                      disabled={!canUpdate || busyId === row.id}
                      aria-label={t("maintenance.markSolved", {
                        name: row.villaNumber,
                      })}
                      onCheckedChange={(checked) =>
                        void toggleSolved(row, checked === true)
                      }
                    />
                  </TableCell>
                  {solved && (
                    <TableCell className="px-4 py-3 text-sm tabular-nums">
                      {row.solvedAt ? formatDateTime(row.solvedAt) : "-"}
                    </TableCell>
                  )}
                  <TableCell className="px-4 py-3 text-sm tabular-nums text-muted-foreground">
                    {formatDateTime(row.createdAt)}
                  </TableCell>
                  {(canUpdate || canDelete) && (
                    <TableCell className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {canUpdate && (
                          <IconButton
                            icon="edit"
                            label={t("common.edit")}
                            onClick={() => {
                              setEditing(row)
                              setFormOpen(true)
                            }}
                          />
                        )}
                        {canDelete && (
                          <IconButton
                            icon="trash"
                            label={t("common.delete")}
                            variant="danger"
                            onClick={() => setDeleting(row)}
                          />
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {meta && (
        <VillasListFooter
          meta={meta}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          onGoLastPage={() => setPage(meta.totalPages)}
        />
      )}
      {meta && (
        <p className="mt-3 text-sm text-muted-foreground">
          {t(solved ? "maintenance.solvedCount" : "maintenance.count", {
            count: meta.total,
          })}
        </p>
      )}
      <MaintenanceFormModal
        open={formOpen}
        item={editing}
        onClose={() => setFormOpen(false)}
      />
      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={t("maintenance.deleteTitle")}
        message={t("maintenance.deleteBody", {
          name: deleting?.villaNumber ?? "",
        })}
        confirmLabel={t("common.delete")}
        confirmPending={remove.isPending}
      />
    </>
  )
}

import { VillaCell } from "@/shared/list/cells"
import SortableHead from "@/shared/list/SortableHead"
import { useState } from "react"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import VillasListFooter from "@/features/villas/components/VillasListFooter"
import { toApiError } from "@/shared/api/errors"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import { normalizeSearchInput } from "@/shared/lib/phone/phoneNormalize"
import { formatDateTime } from "@/shared/lib/format"
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
  useDeleteOwnerNoteMutation,
  useOwnerNotesListParams,
  useOwnerNotesListQuery,
  useUpdateOwnerNoteMutation,
  type OwnerNote,
} from "../api"
import OwnerNoteFormModal from "../components/OwnerNoteFormModal"
import OwnerNoteViewModal from "../components/OwnerNoteViewModal"

/**
 * The owner notes: the open ones (`done` false), reminded every day through the notifications, or the done ones. Checking
 * "Done" moves a note to the done page and stops its reminders; unchecking it there moves it back.
 */
export default function OwnerNotesListPage({ done }: { done: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { can } = usePermissions()
  const canCreate = can("owner-notes:create")
  const canUpdate = can("owner-notes:update")
  const canDelete = can("owner-notes:delete")
  const { params, setParam, setPage, setLimit } = useOwnerNotesListParams(done)
  const { data, isLoading, isError, error, refetch } =
    useOwnerNotesListQuery(params)
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setParam,
    normalizeSearchInput,
  )
  const update = useUpdateOwnerNoteMutation()
  const remove = useDeleteOwnerNoteMutation()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<OwnerNote | undefined>()
  const [deleting, setDeleting] = useState<OwnerNote | null>(null)
  const [viewing, setViewing] = useState<OwnerNote | null>(null)

  const columnCount = (done ? 7 : 6) + (canUpdate || canDelete ? 1 : 0)

  // Checked on the open list: done, so it moves to the done page. Unchecked there: back to the open list.
  const toggleDone = async (row: OwnerNote, next: boolean) => {
    setBusyId(row.id)
    try {
      await update.mutateAsync({
        id: row.id,
        input: { done: next },
        write: { ifMatch: row.version },
      })
      toast.success(
        t(next ? "ownerNotes.movedToDone" : "ownerNotes.movedBack", {
          name: row.villa.villaNumber,
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
      toast.success(
        t("ownerNotes.deleted", { name: deleting.villa.villaNumber }),
      )
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
        title={t(done ? "ownerNotes.doneTitle" : "ownerNotes.title")}
        subtitle={t(done ? "ownerNotes.doneSubtitle" : "ownerNotes.subtitle")}
        actions={
          <div className="flex flex-wrap gap-2">
            {done ? (
              <Button
                type="button"
                size="sm"
                icon="file"
                onClick={() => navigate("/owner-notes")}
              >
                {t("ownerNotes.title")}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  icon="check"
                  onClick={() => navigate("/owner-notes/done")}
                >
                  {t("ownerNotes.doneTitle")}
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
                    {t("ownerNotes.add")}
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
          placeholder={t("ownerNotes.searchPlaceholder")}
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
      <div className="list-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="list-head-row">
              <SortableHead
                label={t("ownerNotes.villaNumber")}
                field="villaNumber"
                sort={params.sort}
                onSort={(next) => setParam("sort", next)}
              />
              <TableHead className="px-4 py-2.5">
                {t("ownerNotes.location")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("ownerNotes.ownerName")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("ownerNotes.notes")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("ownerNotes.done")}
              </TableHead>
              {done && (
                <TableHead className="px-4 py-2.5">
                  {t("ownerNotes.doneAt")}
                </TableHead>
              )}
              <TableHead className="px-4 py-2.5">
                {t("ownerNotes.addedAt")}
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
                  {t(done ? "ownerNotes.doneEmpty" : "ownerNotes.empty")}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} tone={row.done ? "success" : undefined}>
                  <TableCell className="px-4 py-3 font-medium tabular-nums">
                    <VillaCell
                      id={row.villa.id}
                      villaNumber={row.villa.villaNumber}
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm" dir="auto">
                    {row.villa.location}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm" dir="auto">
                    {row.ownerName ?? "-"}
                  </TableCell>
                  <TableCell className="max-w-xs px-4 py-3">
                    <Button
                      type="button"
                      size="sm"
                      icon="eye"
                      className="max-w-full"
                      title={t("ownerNotes.viewNotes")}
                      aria-label={t("ownerNotes.viewNotesOf", {
                        name: row.villa.villaNumber,
                      })}
                      onClick={() => setViewing(row)}
                    >
                      <span className="min-w-0 truncate" dir="auto">
                        {row.notes}
                      </span>
                    </Button>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Checkbox
                      checked={row.done}
                      disabled={!canUpdate || busyId === row.id}
                      aria-label={t("ownerNotes.markDone", {
                        name: row.villa.villaNumber,
                      })}
                      onCheckedChange={(checked) =>
                        void toggleDone(row, checked === true)
                      }
                    />
                  </TableCell>
                  {done && (
                    <TableCell className="px-4 py-3 text-sm tabular-nums">
                      {row.doneAt ? formatDateTime(row.doneAt) : "-"}
                    </TableCell>
                  )}
                  <TableCell className="px-4 py-3 text-sm tabular-nums text-muted-foreground">
                    {formatDateTime(row.createdAt)}
                  </TableCell>
                  {(canUpdate || canDelete) && (
                    <TableCell className="px-4 py-3">
                      <div className="row-actions flex justify-end gap-1">
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
          {t(done ? "ownerNotes.doneCount" : "ownerNotes.count", {
            count: meta.total,
          })}
        </p>
      )}
      <OwnerNoteViewModal note={viewing} onClose={() => setViewing(null)} />
      <OwnerNoteFormModal
        open={formOpen}
        item={editing}
        onClose={() => setFormOpen(false)}
      />
      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={t("ownerNotes.deleteTitle")}
        message={t("ownerNotes.deleteBody", {
          name: deleting?.villa.villaNumber ?? "",
        })}
        confirmLabel={t("common.delete")}
        confirmPending={remove.isPending}
      />
    </>
  )
}

import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import { toApiError } from "@/shared/api/errors"
import Button from "@/shared/ui/Button"
import { SearchInput } from "@/shared/ui/Field"
import { ConfirmModal } from "@/shared/ui/Modal"
import PageHeader from "@/shared/ui/PageHeader"
import ListPageHeaderActions from "@/shared/list/ListPageHeaderActions"
import {
  buildElectricalEngineersListQueryParams,
  useDeleteElectricalEngineerMutation,
  useUpdateElectricalEngineerMutation,
  useElectricalEngineersListParams,
  useElectricalEngineersListQuery,
} from "../api"
import { ifMatchWrite } from "@/shared/api/write-safety"
import { toast } from "@/shared/lib/toast"
import type { PartyStatus } from "@/shared/directory/party.types"
import { downloadExport } from "@/shared/export/downloadExport"
import type { ElectricalEngineer } from "../api"
import ElectricalEngineersTable from "../components/ElectricalEngineersTable"
import ElectricalEngineerFormModal from "../components/ElectricalEngineerFormModal"
import ElectricalEngineersListErrorBanner from "../components/ElectricalEngineersListErrorBanner"
import ElectricalEngineersListFooter from "../components/ElectricalEngineersListFooter"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import { normalizeSearchInput } from "@/shared/lib/phone/phoneNormalize"

export default function ElectricalEngineersPage() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const { params, setParam, setPage, setLimit, toggleSort, clearSearch } =
    useElectricalEngineersListParams()
  const { data, isLoading, isError, error, refetch } =
    useElectricalEngineersListQuery()
  const remove = useDeleteElectricalEngineerMutation()
  const update = useUpdateElectricalEngineerMutation()
  const [statusPendingId, setStatusPendingId] = useState<string | null>(null)
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setParam,
    normalizeSearchInput,
  )
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | undefined>()
  const [deleting, setDeleting] = useState<ElectricalEngineer | null>(null)
  const [savedBanner, setSavedBanner] = useState(false)
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null)

  const canCreate = can("electrical-engineers:create")
  const canUpdate = can("electrical-engineers:update")
  const canDelete = can("electrical-engineers:delete")
  const canExport = can("electrical-engineers:read")

  const onExport = useCallback(
    async (format: "xlsx" | "pdf", signal: AbortSignal) => {
      await downloadExport({
        path: "/electrical-engineers/export",
        query: buildElectricalEngineersListQueryParams(params, {
          forExport: true,
        }),
        format,
        filenameStem: "electrical-engineers",
        signal,
      })
    },
    [params],
  )

  const rows = data?.data ?? []
  const meta = data?.meta
  const apiError = isError ? toApiError(error) : null
  const hasSearch = !!(params.search && params.search.length > 0)
  const emptyCatalog = !hasSearch && !isLoading && rows.length === 0 && !isError
  const emptySearch = hasSearch && !isLoading && rows.length === 0 && !isError

  const sort = params.sort ?? ""
  const nameSort =
    sort === "name:desc"
      ? "desc"
      : sort.startsWith("createdAt")
        ? "none"
        : "default"
  const createdSort = sort.startsWith("createdAt")
    ? sort === "createdAt:asc"
      ? "asc"
      : "desc"
    : "none"

  const showGlobalError = useMemo(
    () =>
      apiError &&
      (apiError.status === 403 ||
        apiError.status >= 500 ||
        apiError.code === "NETWORK_ERROR"),
    [apiError],
  )

  const openCreate = () => {
    setEditId(undefined)
    setFormOpen(true)
  }
  const openEdit = (row: ElectricalEngineer) => {
    setEditId(row.id)
    setFormOpen(true)
  }

  const toggleStatus = async (row: ElectricalEngineer, active: boolean) => {
    const next: PartyStatus = active ? "ACTIVE" : "INACTIVE"
    if (row.status === next) return
    setStatusPendingId(row.id)
    try {
      await update.mutateAsync({
        id: row.id,
        input: { status: next },
        write: ifMatchWrite(row.version),
      })
    } catch (err) {
      const parsed = toApiError(err)
      toast.error(parsed.message || t("common.listErrorTitle"))
    } finally {
      setStatusPendingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteNotice(null)
    try {
      await remove.mutateAsync({
        id: deleting.id,
        write: { ifMatch: deleting.version },
      })
      setDeleting(null)
    } catch (err) {
      const parsed = toApiError(err)
      if (
        parsed.code === "ELECTRICAL_ENGINEER_NOT_FOUND" ||
        parsed.status === 404
      ) {
        setDeleteNotice(t("electricalEngineers.deleteAlreadyGone"))
        setDeleting(null)
        void refetch()
        return
      }
      if (parsed.code === "ELECTRICAL_ENGINEER_IN_USE") {
        setDeleteNotice(parsed.message)
        setDeleting(null)
        void refetch()
        return
      }
      setDeleteNotice(parsed.message)
    }
  }

  return (
    <>
      <PageHeader
        title={t("electricalEngineers.title")}
        subtitle={t("electricalEngineers.subtitle")}
        actions={
          canCreate || canExport ? (
            <ListPageHeaderActions
              exportAction={
                canExport
                  ? {
                      kind: "menu",
                      total: meta?.total,
                      listLoading: isLoading,
                      onExport,
                    }
                  : undefined
              }
              add={
                canCreate
                  ? {
                      label: t("electricalEngineers.addTitle"),
                      onClick: openCreate,
                    }
                  : undefined
              }
            />
          ) : undefined
        }
      />
      {savedBanner && (
        <p className="mb-3 rounded-lg bg-closed-soft px-3 py-2 text-sm text-closed">
          {t("common.saved")}
        </p>
      )}
      {deleteNotice && (
        <p role="status" className="mb-3 rounded-lg bg-muted px-3 py-2 text-sm">
          {deleteNotice}
        </p>
      )}
      <div className="mb-3 flex flex-wrap items-start gap-2">
        <SearchInput
          value={searchDraft}
          onChange={setSearchDraft}
          placeholder={t("electricalEngineers.searchPlaceholder")}
        />
      </div>
      <ElectricalEngineersListErrorBanner
        error={showGlobalError ? apiError : null}
        onRetry={() => void refetch()}
      />
      <ElectricalEngineersTable
        rows={rows}
        isLoading={isLoading && !data}
        nameSort={nameSort}
        createdSort={createdSort}
        onToggleNameSort={() => toggleSort("name")}
        onToggleCreatedSort={() => toggleSort("createdAt")}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onEdit={openEdit}
        onDelete={setDeleting}
        onToggleStatus={canUpdate ? toggleStatus : undefined}
        statusPendingId={statusPendingId}
        deleteDisabled={(row) => row.villaCount > 0}
        deleteDisabledTitle={(row) =>
          row.villaCount > 0
            ? t("electricalEngineers.deleteBlockedProjects", {
                count: row.villaCount,
              })
            : undefined
        }
      />
      {emptyCatalog && (
        <div className="border border-t-0 border-border px-6 py-14 text-center">
          <p className="font-medium">{t("electricalEngineers.emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("electricalEngineers.emptyBody")}
          </p>
          {canCreate && (
            <Button
              type="button"
              className="mt-3"
              variant="primary"
              onClick={openCreate}
            >
              {t("electricalEngineers.addTitle")}
            </Button>
          )}
        </div>
      )}
      {emptySearch && (
        <div className="border border-t-0 border-border px-6 py-14 text-center">
          <p className="font-medium">
            {t("electricalEngineers.emptySearchTitle")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("electricalEngineers.emptySearchBody")}
          </p>
          <Button
            type="button"
            className="mt-3"
            variant="ghost"
            onClick={clearSearch}
          >
            {t("electricalEngineers.clearSearch")}
          </Button>
        </div>
      )}
      {meta && (
        <ElectricalEngineersListFooter
          meta={meta}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          onGoLastPage={() => setPage(meta.totalPages)}
        />
      )}
      <ElectricalEngineerFormModal
        open={formOpen}
        engineerId={editId}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setSavedBanner(true)
          window.setTimeout(() => setSavedBanner(false), 3000)
          void refetch()
        }}
        onDeletedWhileEditing={() => {
          setDeleteNotice(t("electricalEngineers.editDeleted"))
          void refetch()
        }}
      />
      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void handleDelete()}
        closeOnConfirm={false}
        title={t("electricalEngineers.deleteTitle")}
        message={t("electricalEngineers.deleteBody", {
          name: deleting?.name ?? "",
          phone: deleting?.phone ?? "",
        })}
      />
    </>
  )
}

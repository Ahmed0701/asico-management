import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import { toApiError } from "@/shared/api/errors"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import { normalizeSearchInput } from "@/shared/lib/phone/phoneNormalize"
import Button from "@/shared/ui/Button"
import { SearchInput } from "@/shared/ui/Field"
import { ConfirmModal } from "@/shared/ui/Modal"
import PageHeader from "@/shared/ui/PageHeader"
import { ImportWizardModal, IMPORT_RESOURCES } from "@/shared/import"
import ListPageHeaderActions from "@/shared/list/ListPageHeaderActions"
import {
  buildContractorsListQueryParams,
  useContractorsListParams,
  useContractorsListQuery,
  useDeleteContractorMutation,
  useUpdateContractorMutation,
  invalidateContractorsListsAndDashboard,
} from "../api"
import { ifMatchWrite } from "@/shared/api/write-safety"
import { toast } from "@/shared/lib/toast"
import type { PartyStatus } from "@/shared/directory/party.types"
import { downloadExport } from "@/shared/export/downloadExport"
import type { Contractor } from "../api"
import ContractorFormModal from "../components/ContractorFormModal"
import ContractorsListErrorBanner from "../components/ContractorsListErrorBanner"
import ContractorsListFooter from "../components/ContractorsListFooter"
import ContractorsTable from "../components/ContractorsTable"

export default function ContractorsPage() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const { params, setParam, setPage, setLimit, toggleSort, clearSearch } =
    useContractorsListParams()
  const { data, isLoading, isError, error, refetch } = useContractorsListQuery()
  const remove = useDeleteContractorMutation()
  const update = useUpdateContractorMutation()
  const [statusPendingId, setStatusPendingId] = useState<string | null>(null)
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setParam,
    normalizeSearchInput,
  )
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | undefined>()
  const [deleting, setDeleting] = useState<Contractor | null>(null)
  const [savedBanner, setSavedBanner] = useState(false)
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null)

  const canCreate = can("contractors:create")
  const canUpdate = can("contractors:update")
  const canDelete = can("contractors:delete")
  const canSummary = can("contractors:summary")
  const canExport = can("contractors:read")
  const canImport = can("contractors:import")
  const qc = useQueryClient()
  const [importOpen, setImportOpen] = useState(false)

  const onExport = useCallback(
    async (format: "xlsx" | "pdf", signal: AbortSignal) => {
      await downloadExport({
        path: "/contractors/export",
        query: buildContractorsListQueryParams(params, { forExport: true }),
        format,
        filenameStem: "contractors",
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
  const openEdit = (row: Contractor) => {
    setEditId(row.id)
    setFormOpen(true)
  }

  const toggleStatus = async (row: Contractor, active: boolean) => {
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
      if (parsed.code === "CONTRACTOR_NOT_FOUND" || parsed.status === 404) {
        setDeleteNotice(t("contractors.deleteAlreadyGone"))
        setDeleting(null)
        void refetch()
        return
      }
      if (parsed.code === "CONTRACTOR_HAS_VILLAS") {
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
        title={t("contractors.title")}
        subtitle={t("contractors.subtitle")}
        actions={
          canCreate || canExport || canImport ? (
            <ListPageHeaderActions
              showImport={canImport}
              importLabel={t("contractors.import")}
              importAction={
                canImport
                  ? {
                      kind: "button",
                      label: t("contractors.import"),
                      onClick: () => setImportOpen(true),
                    }
                  : undefined
              }
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
                  ? { label: t("contractors.addTitle"), onClick: openCreate }
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
          placeholder={t("contractors.searchPlaceholder")}
        />
      </div>
      <ContractorsListErrorBanner
        error={showGlobalError ? apiError : null}
        onRetry={() => void refetch()}
      />
      <ContractorsTable
        rows={rows}
        isLoading={isLoading && !data}
        nameSort={nameSort}
        createdSort={createdSort}
        onToggleNameSort={() => toggleSort("name")}
        onToggleCreatedSort={() => toggleSort("createdAt")}
        canUpdate={canUpdate}
        canDelete={canDelete}
        canSummary={canSummary}
        onEdit={openEdit}
        onDelete={setDeleting}
        onToggleStatus={canUpdate ? toggleStatus : undefined}
        statusPendingId={statusPendingId}
        deleteDisabled={(row) => row.villaCount > 0}
        deleteDisabledTitle={(row) =>
          row.villaCount > 0
            ? t("contractors.deleteBlockedProjects", {
                count: row.villaCount,
              })
            : undefined
        }
      />
      {emptyCatalog && (
        <div className="border border-t-0 border-border px-6 py-14 text-center">
          <p className="font-medium">{t("contractors.emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("contractors.emptyBody")}
          </p>
          {canCreate && (
            <Button
              type="button"
              className="mt-3"
              variant="primary"
              onClick={openCreate}
            >
              {t("contractors.addTitle")}
            </Button>
          )}
        </div>
      )}
      {emptySearch && (
        <div className="border border-t-0 border-border px-6 py-14 text-center">
          <p className="font-medium">{t("contractors.emptySearchTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("contractors.emptySearchBody")}
          </p>
          <Button
            type="button"
            className="mt-3"
            variant="ghost"
            onClick={clearSearch}
          >
            {t("contractors.clearSearch")}
          </Button>
        </div>
      )}
      {meta && (
        <ContractorsListFooter
          meta={meta}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          onGoLastPage={() => setPage(meta.totalPages)}
        />
      )}
      <ContractorFormModal
        open={formOpen}
        contractorId={editId}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setSavedBanner(true)
          window.setTimeout(() => setSavedBanner(false), 3000)
          void refetch()
        }}
        onDeletedWhileEditing={() => {
          setDeleteNotice(t("contractors.editDeleted"))
          void refetch()
        }}
      />
      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void handleDelete()}
        closeOnConfirm={false}
        title={t("contractors.deleteTitle")}
        message={t("contractors.deleteBody", {
          name: deleting?.name ?? "",
          phone: deleting?.phone ?? "",
        })}
      />
      <ImportWizardModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        config={IMPORT_RESOURCES.contractors}
        onSuccess={() => invalidateContractorsListsAndDashboard(qc)}
      />
    </>
  )
}

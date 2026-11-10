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
import ListPageHeaderActions from "@/shared/list/ListPageHeaderActions"
import {
  buildAreasListQueryParams,
  useAreasListParams,
  useAreasListQuery,
  useDeleteAreaMutation,
  type Area,
} from "../api"
import { downloadExport } from "@/shared/export/downloadExport"
import { toast } from "@/shared/lib/toast"
import AreaFormModal from "../components/AreaFormModal"
import AreasListErrorBanner from "../components/AreasListErrorBanner"
import AreasListFooter from "../components/AreasListFooter"
import AreasTable from "../components/AreasTable"

export default function AreasPage() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const { params, setParam, setPage, setLimit, toggleSort, clearSearch } =
    useAreasListParams()
  const { data, isLoading, isError, error, refetch } = useAreasListQuery()
  const remove = useDeleteAreaMutation()
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setParam,
    normalizeSearchInput,
  )

  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | undefined>()
  const [deleting, setDeleting] = useState<Area | null>(null)
  const [savedBanner, setSavedBanner] = useState(false)

  const canCreate = can("areas:create")
  const canUpdate = can("areas:update")
  const canDelete = can("areas:delete")
  const canExport = can("areas:read")

  const onExport = useCallback(
    async (format: "xlsx" | "pdf", signal: AbortSignal) => {
      await downloadExport({
        path: "/areas/export",
        query: buildAreasListQueryParams(params, { forExport: true }),
        format,
        filenameStem: "areas",
        signal,
      })
    },
    [params],
  )

  const rows = data?.data ?? []
  const meta = data?.meta
  const apiError = isError ? toApiError(error) : null
  const hasSearch = !!(params.search && params.search.length > 0)

  const sort = params.sort ?? ""
  const nameSort =
    sort === "name:desc"
      ? "desc"
      : sort.startsWith("city") ||
          sort.startsWith("villaCount") ||
          sort.startsWith("createdAt")
        ? "none"
        : "default"
  const citySort = sort.startsWith("city")
    ? sort === "city:asc"
      ? "asc"
      : "desc"
    : "none"
  const villaCountSort = sort.startsWith("villaCount")
    ? sort === "villaCount:asc"
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

  const openEdit = (row: Area) => {
    setEditId(row.id)
    setFormOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync({
        id: deleting.id,
        write: { ifMatch: deleting.version },
      })
      setDeleting(null)
    } catch (err) {
      const parsed = toApiError(err)
      if (parsed.code === "AREA_NOT_FOUND" || parsed.status === 404) {
        toast.error(t("areas.deleteAlreadyGone"))
        setDeleting(null)
        void refetch()
        return
      }
      if (parsed.code === "AREA_HAS_VILLAS") {
        toast.error(t("areas.deleteHasVillas"))
        setDeleting(null)
        return
      }
      if (parsed.code === "VERSION_CONFLICT") {
        toast.error(parsed.message)
        setDeleting(null)
        void refetch()
        return
      }
      toast.error(parsed.message || t("common.listErrorTitle"))
      setDeleting(null)
    }
  }

  return (
    <>
      <PageHeader
        title={t("areas.title")}
        subtitle={t("areas.subtitle")}
        actions={
          canCreate || canExport ? (
            <ListPageHeaderActions
              showImport={false}
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
                  ? { label: t("areas.add"), onClick: openCreate }
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
      <div className="mb-3 flex flex-wrap items-start gap-2">
        <SearchInput
          value={searchDraft}
          onChange={setSearchDraft}
          placeholder={t("areas.searchPlaceholder")}
        />
        {hasSearch && (
          <Button type="button" variant="ghost" size="sm" onClick={clearSearch}>
            {t("areas.clearSearch")}
          </Button>
        )}
      </div>
      <AreasListErrorBanner
        error={showGlobalError ? apiError : null}
        onRetry={() => void refetch()}
      />
      <AreasTable
        rows={rows}
        isLoading={isLoading && !data}
        nameSort={nameSort}
        citySort={citySort}
        villaCountSort={villaCountSort}
        createdSort="none"
        onToggleNameSort={() => toggleSort("name")}
        onToggleCitySort={() => toggleSort("city")}
        onToggleVillaCountSort={() => toggleSort("villaCount")}
        onToggleCreatedSort={() => toggleSort("createdAt")}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onEdit={openEdit}
        onDelete={setDeleting}
        deleteDisabled={() => false}
        deleteDisabledTitle={() => undefined}
      />
      {meta && meta.total > 0 && (
        <AreasListFooter
          meta={meta}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          onGoLastPage={() => setPage(meta.totalPages)}
        />
      )}
      {!isLoading && !isError && rows.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          {hasSearch ? t("areas.emptySearch") : t("areas.empty")}
        </p>
      )}
      <AreaFormModal
        open={formOpen}
        areaId={editId}
        onClose={() => setFormOpen(false)}
        onSaved={() => setSavedBanner(true)}
        onDeletedWhileEditing={() => {
          setFormOpen(false)
          void refetch()
        }}
      />
      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        closeOnConfirm={false}
        title={t("areas.deleteTitle")}
        message={t("areas.deleteBody", { name: deleting?.name ?? "" })}
        confirmPending={remove.isPending}
      />
    </>
  )
}

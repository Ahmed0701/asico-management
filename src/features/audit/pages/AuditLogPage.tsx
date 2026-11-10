import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import PageHeader from "@/shared/ui/PageHeader"
import ListPageHeaderActions from "@/shared/list/ListPageHeaderActions"
import Button from "@/shared/ui/Button"
import { SearchInput } from "@/shared/ui/Field"
import { toApiError } from "@/shared/api/errors"
import {
  buildAuditListQueryParams,
  useAuditFiltersQuery,
  useAuditListParams,
  useAuditListQuery,
} from "../api"
import { downloadExport } from "@/shared/export/downloadExport"
import { auditFieldErrorsFromApi } from "../api/audit.errors"
import AuditLogFilters from "../components/AuditLogFilters"
import AuditLogTable from "../components/AuditLogTable"
import AuditListFooter from "../components/AuditListFooter"
import AuditListErrorBanner from "../components/AuditListErrorBanner"

export default function AuditLogPage() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const { params, setParam, setPage, setLimit, toggleTimeSort, clearAll } =
    useAuditListParams()
  const canExport = can("audit:read")

  const onExport = useCallback(
    async (format: "xlsx" | "pdf", signal: AbortSignal) => {
      await downloadExport({
        path: "/audit-logs/export",
        query: buildAuditListQueryParams(params, { forExport: true }),
        format,
        filenameStem: "audit-logs",
        signal,
      })
    },
    [params],
  )
  const { data: filters } = useAuditFiltersQuery()
  const { data, isLoading, isError, error, refetch, isFetching } =
    useAuditListQuery()
  const [searchDraft, setSearchDraft] = useState(params.search ?? "")

  useEffect(() => {
    setSearchDraft(params.search ?? "")
  }, [params.search])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = searchDraft.trim()
      const current = params.search ?? ""
      if (next !== current) setParam("search", next || undefined)
    }, 300)
    return () => window.clearTimeout(handle)
  }, [searchDraft, params.search, setParam])

  const apiError = isError ? toApiError(error) : null
  const fieldErrors = useMemo(
    () => (apiError ? auditFieldErrorsFromApi(apiError) : {}),
    [apiError],
  )
  const showGlobalError =
    apiError &&
    (apiError.status === 403 ||
      apiError.status >= 500 ||
      apiError.code === "NETWORK_ERROR" ||
      (apiError.status === 400 && Object.keys(fieldErrors).length === 0))

  const rows = data?.data ?? []
  const meta = data?.meta
  const sortAsc = params.sort === "createdAt:asc"
  const showEmpty = !isLoading && !isError && rows.length === 0 && meta

  return (
    <>
      <PageHeader
        title={t("audit.title")}
        subtitle={t("audit.subtitle")}
        actions={
          canExport ? (
            <ListPageHeaderActions
              exportAction={{
                kind: "menu",
                total: meta?.total,
                listLoading: isLoading,
                onExport,
              }}
            />
          ) : undefined
        }
      />
      <div className="mb-3 flex flex-wrap items-start gap-2">
        <SearchInput
          className="min-w-52 flex-1 sm:max-w-xl"
          value={searchDraft}
          onChange={setSearchDraft}
          placeholder={t("audit.searchPlaceholder")}
        />
        <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
          {t("audit.clearAllFilters")}
        </Button>
      </div>
      <AuditLogFilters
        params={params}
        setParam={setParam}
        filters={filters}
        fieldErrors={fieldErrors}
      />
      <AuditListErrorBanner
        error={showGlobalError ? apiError : null}
        onRetry={() => void refetch()}
      />
      <AuditLogTable
        rows={rows}
        isLoading={isLoading && !data}
        sortAsc={sortAsc}
        onToggleSort={toggleTimeSort}
        onActorFilter={(id) => setParam("actorId", id)}
      />
      {showEmpty && (
        <div className="border border-t-0 border-border px-6 py-14 text-center">
          <p className="font-medium">{t("audit.emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("audit.emptyBody")}
          </p>
          <Button
            type="button"
            className="mt-3"
            variant="ghost"
            onClick={clearAll}
          >
            {t("audit.clearAllFilters")}
          </Button>
        </div>
      )}
      {meta && (
        <AuditListFooter
          meta={meta}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          onGoLastPage={() => setPage(meta.totalPages)}
        />
      )}
      {isFetching && data && (
        <p className="sr-only" aria-live="polite">
          {t("common.loading")}
        </p>
      )}
      {meta &&
        meta.page > meta.totalPages &&
        meta.total > 0 &&
        rows.length === 0 && (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {t("audit.pagePastEnd")}{" "}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-1 text-accent underline hover:bg-transparent"
              onClick={() => setPage(meta.totalPages)}
            >
              {t("audit.goToLastPage")}
            </Button>
          </p>
        )}
    </>
  )
}

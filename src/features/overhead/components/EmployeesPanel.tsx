import { useMemo, useState } from "react"
import { useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import VillasListFooter from "@/features/villas/components/VillasListFooter"
import { toApiError } from "@/shared/api/errors"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import { toast } from "@/shared/lib/toast"
import { normalizeSearchInput } from "@/shared/lib/phone/phoneNormalize"
import { parseListParams, setListParam } from "@/shared/query/listParams"
import Button from "@/shared/ui/Button"
import { ConfirmModal } from "@/shared/ui/Modal"
import {
  OVERHEAD_SORT_PATTERN,
  useDeleteOverheadMutation,
  useOverheadListQuery,
  type OverheadEmployee,
  type OverheadListParams,
} from "../api"
import OverheadFormModal from "./OverheadFormModal"
import OverheadSummary from "./OverheadSummary"
import OverheadTable from "./OverheadTable"
import ListToolbar, {
  clearedListParams,
  countActive,
} from "@/shared/list/ListToolbar"

/** null: closed; no employee: adding one. */
type FormState = { employee?: OverheadEmployee } | null

/** The department's overhead employees: who they are, their role and their monthly salary in KWD. */
export default function EmployeesPanel({ locale }: { locale: string }) {
  const { t } = useTranslation()
  const [toolbarParams, setToolbarParams] = useSearchParams()
  const { can } = usePermissions()
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo<OverheadListParams>(() => {
    const base = parseListParams(searchParams, { limit: 20 })
    const sort = searchParams.get("sort") ?? ""
    return {
      page: base.page,
      limit: base.limit,
      search: base.search || undefined,
      sort: OVERHEAD_SORT_PATTERN.test(sort) ? sort : undefined,
    }
  }, [searchParams])
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(setListParam(searchParams, key, value))
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setParam,
    normalizeSearchInput,
  )
  const query = useOverheadListQuery(params)
  const remove = useDeleteOverheadMutation()
  const [form, setForm] = useState<FormState>(null)
  const [deleting, setDeleting] = useState<OverheadEmployee | null>(null)

  const meta = query.data?.meta
  const totals = query.data?.totals

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync({ id: deleting.id, version: deleting.version })
      toast.success(t("overhead.deleted"))
      setDeleting(null)
    } catch (err) {
      const parsed = toApiError(err)
      if (parsed.status === 404) {
        setDeleting(null)
        void query.refetch()
      }
      toast.error(parsed.message)
    }
  }

  return (
    <>
      {totals && <OverheadSummary totals={totals} locale={locale} />}

      <ListToolbar
        search={{
          value: searchDraft,
          onChange: setSearchDraft,
          placeholder: t("overhead.searchPlaceholder"),
        }}
        count={meta?.total}
        activeCount={countActive(params.search)}
        onClear={() => setToolbarParams(clearedListParams(toolbarParams))}
        actions={
          <>
            {can("overhead:create") && (
              <Button
                type="button"
                size="sm"
                variant="primary"
                icon="plus"
                onClick={() => setForm({})}
              >
                {t("overhead.add")}
              </Button>
            )}
          </>
        }
      />

      {query.isError && (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {toApiError(query.error).message}
        </p>
      )}

      <OverheadTable
        rows={query.data?.data ?? []}
        loading={query.isLoading}
        sort={params.sort}
        onSort={(next) => setParam("sort", next)}
        locale={locale}
        canEdit={can("overhead:update")}
        canDelete={can("overhead:delete")}
        onEdit={(employee) => setForm({ employee })}
        onDelete={setDeleting}
      />

      {meta && (
        <VillasListFooter
          meta={meta}
          onPageChange={(page) => setParam("page", String(page))}
          onPageSizeChange={(limit) => setParam("limit", String(limit))}
          onGoLastPage={() => setParam("page", String(meta.totalPages))}
        />
      )}

      {form && (
        <OverheadFormModal
          employee={form.employee}
          onClose={() => setForm(null)}
        />
      )}

      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        closeOnConfirm={false}
        title={t("overhead.deleteTitle")}
        message={t("overhead.deleteBody", { name: deleting?.name ?? "" })}
        confirmPending={remove.isPending}
      />
    </>
  )
}

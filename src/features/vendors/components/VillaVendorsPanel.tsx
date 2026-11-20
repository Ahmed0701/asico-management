import { useMemo, useState } from "react"
import { useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"
import {
  Building2,
  Cable,
  CircleAlert,
  Zap,
  type LucideIcon,
} from "lucide-react"
import {
  FACTORY_TYPES,
  useFactoriesQuery,
  type FactoryType,
} from "@/features/materials/api"
import VillasListFooter from "@/features/villas/components/VillasListFooter"
import { usePermissions } from "@/features/auth/api"
import { toApiError } from "@/shared/api/errors"
import { toast } from "@/shared/lib/toast"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import { cn } from "@/shared/lib/cn"
import { normalizeSearchInput } from "@/shared/lib/phone/phoneNormalize"
import ListToolbar, {
  clearedListParams,
  countActive,
} from "@/shared/list/ListToolbar"
import { parseListParams, setListParam } from "@/shared/query/listParams"
import { FilterSelect } from "@/shared/ui/Field"
import Button from "@/shared/ui/Button"
import { ConfirmModal } from "@/shared/ui/Modal"
import { Card } from "@/shared/ui/PageHeader"
import {
  useRemoveVendorVillaMutation,
  useVillaVendorsQuery,
  type VillaVendors,
  type VillaVendorsParams,
} from "../api"
import VendorFormModal from "./VendorFormModal"
import VillaVendorsTable from "./VillaVendorsTable"

type TileProps = {
  icon: LucideIcon
  label: string
  value: number
  tone: string
}

function Tile({ icon: TileIcon, label, value, tone }: TileProps) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          tone,
        )}
      >
        <TileIcon size={18} strokeWidth={1.9} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold tabular-nums">{value}</p>
      </div>
    </Card>
  )
}

const isType = (value: string | null): value is FactoryType =>
  (FACTORY_TYPES as readonly string[]).includes(value ?? "")

/** The villas on the Vendors list, each with its switchgear factory and cable factory, assigned from a form. */
export default function VillaVendorsPanel() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo<VillaVendorsParams>(() => {
    const base = parseListParams(searchParams, { limit: 20 })
    const sort = searchParams.get("sort") ?? ""
    const missing = searchParams.get("missing")
    return {
      page: base.page,
      limit: base.limit,
      search: base.search || undefined,
      factoryId: searchParams.get("factoryId") || undefined,
      missing: isType(missing) ? missing : undefined,
      sort: /^villaNumber(:(asc|desc))?$/.test(sort) ? sort : undefined,
    }
  }, [searchParams])
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(setListParam(searchParams, key, value))
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setParam,
    normalizeSearchInput,
  )
  const query = useVillaVendorsQuery(params)
  const factories = useFactoriesQuery()
  const { can } = usePermissions()
  // null: closed; no row: adding a villa.
  const [form, setForm] = useState<{ row?: VillaVendors } | null>(null)
  const remove = useRemoveVendorVillaMutation()
  const [removing, setRemoving] = useState<VillaVendors | null>(null)
  const canEdit = can("materials:update")

  const confirmRemove = async () => {
    if (!removing) return
    try {
      await remove.mutateAsync({
        villaId: removing.villa.id,
        version: removing.version,
      })
      toast.success(
        t("vendors.villaRemoved", { name: removing.villa.villaNumber }),
      )
      setRemoving(null)
    } catch (err) {
      toast.error(toApiError(err).message)
      setRemoving(null)
      void query.refetch()
    }
  }

  const rows = query.data?.data ?? []
  const meta = query.data?.meta
  const summary = query.data?.summary
  const factoryOptions = (factories.data ?? []).map((factory) => ({
    value: factory.id,
    label: `${factory.name} · ${t(`materials.types.${factory.type}`)}`,
  }))

  return (
    <>
      {summary && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Tile
            icon={Building2}
            label={t("vendors.summaryVillas")}
            value={summary.villaCount}
            tone="bg-muted text-muted-foreground"
          />
          <Tile
            icon={Zap}
            label={t("vendors.summarySwitchgear")}
            value={summary.withSwitchgear}
            tone="bg-sky-500/10 text-sky-600"
          />
          <Tile
            icon={Cable}
            label={t("vendors.summaryCable")}
            value={summary.withCable}
            tone="bg-amber-500/10 text-amber-600"
          />
          <Tile
            icon={CircleAlert}
            label={t("vendors.summaryNone")}
            value={summary.withNone}
            tone={
              summary.withNone > 0
                ? "bg-danger-soft text-danger"
                : "bg-success-soft text-success"
            }
          />
        </div>
      )}

      <ListToolbar
        search={{
          value: searchDraft,
          onChange: setSearchDraft,
          placeholder: t("vendors.searchPlaceholder"),
        }}
        count={meta?.total}
        activeCount={countActive(
          params.search,
          params.factoryId,
          params.missing,
        )}
        onClear={() => setSearchParams(clearedListParams(searchParams))}
        columns={2}
        actions={
          canEdit ? (
            <Button
              type="button"
              size="sm"
              variant="primary"
              icon="plus"
              onClick={() => setForm({})}
            >
              {t("vendors.addVilla")}
            </Button>
          ) : undefined
        }
      >
        <FilterSelect
          label={t("vendors.factory")}
          value={params.factoryId ?? ""}
          onChange={(v) => setParam("factoryId", v || undefined)}
          options={factoryOptions}
        />
        <FilterSelect
          label={t("vendors.missing")}
          value={params.missing ?? ""}
          onChange={(v) => setParam("missing", v || undefined)}
          options={FACTORY_TYPES.map((type) => ({
            value: type,
            label: t(`vendors.missingTypes.${type}`),
          }))}
        />
      </ListToolbar>

      {query.isError && (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {toApiError(query.error).message}
        </p>
      )}

      <VillaVendorsTable
        rows={rows}
        loading={query.isLoading}
        sort={params.sort}
        onSort={(next) => setParam("sort", next)}
        canEdit={canEdit}
        onEdit={(row) => setForm({ row })}
        onRemove={setRemoving}
      />

      {meta && (
        <VillasListFooter
          meta={meta}
          onPageChange={(page) => setParam("page", String(page))}
          onPageSizeChange={(limit) => setParam("limit", String(limit))}
          onGoLastPage={() => setParam("page", String(meta.totalPages))}
        />
      )}
      {form && <VendorFormModal row={form.row} onClose={() => setForm(null)} />}
      <ConfirmModal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemove}
        closeOnConfirm={false}
        title={t("vendors.removeTitle")}
        message={t("vendors.removeBody", {
          name: removing?.villa.villaNumber ?? "",
        })}
        confirmPending={remove.isPending}
      />
    </>
  )
}

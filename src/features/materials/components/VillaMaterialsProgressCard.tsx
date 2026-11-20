import { useState } from "react"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { Package } from "lucide-react"
import { usePermissions } from "@/features/auth/api"
import { cn } from "@/shared/lib/cn"
import { Badge } from "@/shared/ui/Badge"
import Button, { IconButton } from "@/shared/ui/Button"
import CollapsibleCard from "@/shared/ui/CollapsibleCard"
import {
  useItemsQuery,
  useMaterialsSummaryQuery,
  type FactoryType,
} from "../api"
import { formatQuantity } from "./DeliveriesTable"
import RequirementsModal from "./RequirementsModal"
import VillaMaterialUpdateModal from "./VillaMaterialUpdateModal"

/** One material of the list for this villa: what it needs (its own quantity or the list's), and what came. */
export type VillaMaterialRow = {
  itemId: string
  name: string
  unit: string
  type: FactoryType
  required: number
  /** The quantity of the materials list (what every villa needs). */
  listRequired: number
  /** The villa has its own quantity instead of the list's. */
  custom: boolean
  delivered: number
  /** How many deliveries brought it, and how many of them have their delivery note. */
  deliveries: number
  withNote: number
}

// Every material of the list, with what the villa needs and received (a material it neither needs nor received is not
// in the summary: it needs the list's quantity, 0, and nothing came).
function rowsOf(
  items: NonNullable<ReturnType<typeof useItemsQuery>["data"]>,
  summary: ReturnType<typeof useMaterialsSummaryQuery>["data"],
): VillaMaterialRow[] {
  const byItem = new Map((summary?.materials ?? []).map((m) => [m.itemId, m]))
  return items.map((item) => {
    const found = byItem.get(item.id)
    return {
      itemId: item.id,
      name: item.name,
      unit: item.unit,
      type: item.type,
      required: found?.required ?? item.requiredPerVilla,
      listRequired: item.requiredPerVilla,
      custom: found?.custom ?? false,
      delivered: found?.delivered ?? 0,
      deliveries: found?.deliveries ?? 0,
      withNote: found?.withNote ?? 0,
    }
  })
}

type ColumnProps = {
  title: string
  tone: "success" | "danger"
  empty: string
  rows: VillaMaterialRow[]
  quantity: (row: VillaMaterialRow) => number
  note: (row: VillaMaterialRow) => string
  canUpdate: boolean
  onUpdate: (row: VillaMaterialRow) => void
}

/** One of the two lists: what came (green), or what is still to come (red). */
function MaterialsColumn({
  title,
  tone,
  empty,
  rows,
  quantity,
  note,
  canUpdate,
  onUpdate,
}: ColumnProps) {
  const { t } = useTranslation()
  return (
    <section className="grid content-start gap-2">
      <h3
        className={cn(
          "flex items-center justify-between text-xs font-semibold uppercase tracking-wide",
          tone === "success" ? "text-success" : "text-danger",
        )}
      >
        <span>{title}</span>
        <span className="tabular-nums">{rows.length}</span>
      </h3>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="grid gap-2">
          {rows.map((row) => (
            <li
              key={row.itemId}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg border px-3 py-2",
                tone === "success"
                  ? "border-success/30 bg-success-soft/40"
                  : "border-danger/30 bg-danger-soft",
              )}
            >
              <span className="min-w-0">
                <span
                  className="block truncate text-sm font-medium"
                  dir="auto"
                  title={row.name}
                >
                  {row.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {note(row)}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <span
                  className={cn(
                    "text-base font-semibold tabular-nums",
                    tone === "success" ? "text-success" : "text-danger",
                  )}
                >
                  {formatQuantity(quantity(row), row.unit)}
                </span>
                {canUpdate && (
                  <IconButton
                    icon="edit"
                    label={t("materials.villaCard.updateOf", {
                      name: row.name,
                    })}
                    onClick={() => onUpdate(row)}
                  />
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

type Props = {
  villaId: string
  villaNumber: string
}

/**
 * The villa's materials in two lists, read from the Materials List and the deliveries: what came (green) and what has
 * not been delivered yet (red, required minus delivered). A material that came in part is in both lists. Updating one
 * sets the villa's own quantity and records a delivery of what came more.
 */
export default function VillaMaterialsProgressCard({
  villaId,
  villaNumber,
}: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { can } = usePermissions()
  const canUpdate = can("materials:update") || can("materials:create")
  const [open, setOpen] = useState(true)
  const items = useItemsQuery()
  const summary = useMaterialsSummaryQuery(villaId)
  const [editing, setEditing] = useState<VillaMaterialRow | null>(null)
  const [requirementsOpen, setRequirementsOpen] = useState(false)
  const canRequire = can("materials:update")

  const rows = rowsOf(items.data ?? [], summary.data)
  const delivered = rows.filter((row) => row.delivered > 0)
  const missing = rows.filter((row) => row.required > row.delivered)
  const s = summary.data

  return (
    <CollapsibleCard
      title={t("materials.deliveredTitle")}
      icon={Package}
      open={open}
      onOpenChange={setOpen}
      badges={
        s && (
          <>
            <Badge tone="neutral">
              {t("materials.deliveryCount", { count: s.deliveries })}
            </Badge>
            <Badge tone={missing.length > 0 ? "danger" : "success"}>
              {missing.length > 0
                ? t("materials.materialsPending", { count: missing.length })
                : t("materials.allMaterialsIn")}
            </Badge>
          </>
        )
      }
    >
      <div className="grid gap-4">
        {items.isLoading || summary.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <MaterialsColumn
              title={t("materials.deliveredList")}
              tone="success"
              empty={t("materials.villaEmpty")}
              rows={delivered}
              quantity={(row) => row.delivered}
              note={(row) =>
                t("materials.fromNotes", {
                  count: row.deliveries,
                  withNote: row.withNote,
                })
              }
              canUpdate={canUpdate}
              onUpdate={setEditing}
            />
            <MaterialsColumn
              title={t("materials.notDeliveredList")}
              tone="danger"
              empty={t("materials.allMaterialsIn")}
              rows={missing}
              quantity={(row) =>
                Math.round((row.required - row.delivered) * 100) / 100
              }
              note={(row) =>
                t("materials.ofRequired", {
                  quantity: formatQuantity(row.required, row.unit),
                })
              }
              canUpdate={canUpdate}
              onUpdate={setEditing}
            />
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            className="text-sm text-accent hover:underline"
            onClick={() =>
              navigate(`/villas/${villaId}?tab=materials`, {
                replace: true,
                state: { scrollToTabs: Date.now() },
              })
            }
          >
            {t("materials.openMaterialsTab")}
          </button>
          {canRequire && (
            <Button
              type="button"
              size="sm"
              icon="edit"
              onClick={() => setRequirementsOpen(true)}
            >
              {t("materials.villaCard.requiredButton")}
            </Button>
          )}
        </div>
      </div>
      <RequirementsModal
        open={requirementsOpen}
        villaId={villaId}
        current={summary.data?.materials ?? []}
        onClose={() => setRequirementsOpen(false)}
      />

      {editing && (
        <VillaMaterialUpdateModal
          villaId={villaId}
          villaNumber={villaNumber}
          row={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </CollapsibleCard>
  )
}

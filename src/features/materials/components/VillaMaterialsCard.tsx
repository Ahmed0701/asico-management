import { useState } from "react"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { cn } from "@/shared/lib/cn"
import { Badge } from "@/shared/ui/Badge"
import Icon from "@/shared/ui/Icon"
import { Card } from "@/shared/ui/PageHeader"
import { useMaterialsSummaryQuery, type MaterialTotal } from "../api"
import { formatQuantity } from "./DeliveriesTable"

/**
 * The villa's materials in two lists: what its delivery notes brought, and what has not been delivered yet (required
 * minus delivered). It reads the recorded deliveries, so it follows them as soon as one is added, edited or deleted. A
 * material that came in part is in both lists: the part that came, and the rest.
 */
export default function VillaMaterialsCard({ villaId }: { villaId: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)
  const summary = useMaterialsSummaryQuery(villaId)
  const s = summary.data
  const delivered = (s?.materials ?? []).filter((m) => m.delivered > 0)
  const missing = (s?.materials ?? []).filter((m) => m.status === "PENDING")

  return (
    <Card className="mb-4 overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-start text-sm font-medium hover:bg-muted/40"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex flex-wrap items-center gap-2">
          {t("materials.deliveredTitle")}
          {s && (
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
          )}
        </span>
        <Icon
          name="chevronDown"
          size={18}
          className={cn(
            "shrink-0 text-muted-foreground transition",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="grid gap-4 border-t border-border p-4 sm:p-5">
          {summary.isLoading ? (
            <p className="text-sm text-muted-foreground">
              {t("common.loading")}
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <MaterialsColumn
                title={t("materials.deliveredList")}
                tone="success"
                empty={t("materials.villaEmpty")}
                rows={delivered}
                quantity={(m) => m.delivered}
                note={(m) =>
                  t("materials.fromNotes", {
                    count: m.deliveries,
                    withNote: m.withNote,
                  })
                }
              />
              <MaterialsColumn
                title={t("materials.notDeliveredList")}
                tone="danger"
                empty={t("materials.allMaterialsIn")}
                rows={missing}
                quantity={(m) => m.balance}
                note={(m) =>
                  t("materials.ofRequired", {
                    quantity: formatQuantity(m.required, m.unit),
                  })
                }
              />
            </div>
          )}
          <button
            type="button"
            className="justify-self-start text-sm text-accent hover:underline"
            onClick={() =>
              navigate(`/villas/${villaId}?tab=materials`, {
                replace: true,
                state: { scrollToTabs: Date.now() },
              })
            }
          >
            {t("materials.openMaterialsTab")}
          </button>
        </div>
      )}
    </Card>
  )
}

function MaterialsColumn({
  title,
  tone,
  empty,
  rows,
  quantity,
  note,
}: {
  title: string
  tone: "success" | "danger"
  empty: string
  rows: MaterialTotal[]
  quantity: (m: MaterialTotal) => number
  note: (m: MaterialTotal) => string
}) {
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
          {rows.map((m) => (
            <li
              key={m.itemId}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg border px-3 py-2",
                tone === "success"
                  ? "border-success/30 bg-success-soft/40"
                  : "border-danger/30 bg-danger-soft",
              )}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium" dir="auto">
                  {m.name}
                </span>
                <span className="text-xs text-muted-foreground">{note(m)}</span>
              </span>
              <span
                className={cn(
                  "shrink-0 text-base font-semibold tabular-nums",
                  tone === "success" ? "text-success" : "text-danger",
                )}
              >
                {formatQuantity(quantity(m), m.unit)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

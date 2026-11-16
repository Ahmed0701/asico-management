import CollapsibleCard from "@/shared/ui/CollapsibleCard"
import { useState } from "react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { Cable, Factory as FactoryIcon, Zap } from "lucide-react"
import { toApiError } from "@/shared/api/errors"
import { formatCalendarDateUtc } from "@/shared/lib/formatCalendarDateUtc"
import { Badge } from "@/shared/ui/Badge"
import {
  useDeliveriesQuery,
  type FactoryType,
  type MaterialDelivery,
} from "../api"

// At most this many deliveries are read for one villa (the list's page limit); a villa has far fewer.
const MAX_DELIVERIES = 1000

type Vendor = {
  id: string
  name: string
  deliveries: number
  // YYYY-MM-DD of its latest delivery to the villa.
  lastDate: string
}

// The factories of one type that delivered to the villa, the latest first.
export function vendorsOf(
  deliveries: readonly MaterialDelivery[],
  type: FactoryType,
): Vendor[] {
  const byId = new Map<string, Vendor>()
  for (const delivery of deliveries) {
    if (delivery.factory.type !== type) continue
    const found = byId.get(delivery.factory.id)
    if (found) {
      found.deliveries += 1
      if (delivery.deliveryDate > found.lastDate)
        found.lastDate = delivery.deliveryDate
    } else {
      byId.set(delivery.factory.id, {
        id: delivery.factory.id,
        name: delivery.factory.name,
        deliveries: 1,
        lastDate: delivery.deliveryDate,
      })
    }
  }
  return [...byId.values()].sort(
    (a, b) =>
      b.lastDate.localeCompare(a.lastDate) || a.name.localeCompare(b.name),
  )
}

type Section = {
  type: FactoryType
  labelKey: string
  icon: typeof Zap
}

const SECTIONS: Section[] = [
  { type: "SWITCHGEAR", labelKey: "materials.vendors.switchgear", icon: Zap },
  { type: "CABLE", labelKey: "materials.vendors.cable", icon: Cable },
]

type Props = {
  villaId: string
  villaNumber: string
}

/**
 * The villa's vendors, folded like the MEW details: the switchgear factory and the cable factory, read from the material
 * deliveries recorded for the villa (the Materials page). A villa supplied by more than one factory of a type lists them
 * all, the latest first. Loaded the first time it is opened.
 */
export default function VillaVendorsCard({ villaId, villaNumber }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const query = useDeliveriesQuery(
    { page: 1, limit: MAX_DELIVERIES, villaId },
    open,
  )
  const deliveries = query.data?.data ?? []

  return (
    <CollapsibleCard
      title={t("materials.vendors.title")}
      icon={FactoryIcon}
      open={open}
      onOpenChange={setOpen}
      badges={
        query.data && (
          <Badge tone="neutral">
            {t("materials.deliveryCount", { count: deliveries.length })}
          </Badge>
        )
      }
    >
      <div>
        {query.isError ? (
          <p role="alert" className="text-sm text-danger">
            {toApiError(query.error).message}
          </p>
        ) : query.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {SECTIONS.map(({ type, labelKey, icon: SectionIcon }) => {
              const vendors = vendorsOf(deliveries, type)
              return (
                <section
                  key={type}
                  aria-label={t(labelKey)}
                  className="rounded-xl border border-border bg-muted/20 p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <span className="grid size-7 place-items-center rounded-lg bg-accent/10 text-accent">
                        <SectionIcon size={15} strokeWidth={2} aria-hidden />
                      </span>
                      {t(labelKey)}
                    </h3>
                    <Link
                      to={`/materials?search=${encodeURIComponent(villaNumber)}&type=${type}`}
                      className="text-xs font-medium text-accent hover:underline"
                    >
                      {t("materials.vendors.openInMaterials")}
                    </Link>
                  </div>
                  {vendors.length === 0 ? (
                    <p className="py-2 text-sm text-muted-foreground">
                      {t("materials.vendors.none")}
                    </p>
                  ) : (
                    <ul className="grid gap-1.5">
                      {vendors.map((vendor, index) => (
                        <li
                          key={vendor.id}
                          className="flex items-center gap-2.5 rounded-lg bg-card px-2.5 py-2 shadow-xs"
                        >
                          <FactoryIcon
                            size={16}
                            strokeWidth={1.9}
                            className="shrink-0 text-muted-foreground"
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate text-sm font-medium"
                              dir="auto"
                            >
                              {vendor.name}
                            </p>
                            <p className="text-xs text-muted-foreground tabular-nums">
                              {t("materials.deliveryCount", {
                                count: vendor.deliveries,
                              })}
                              {" · "}
                              {t("materials.vendors.lastDelivery", {
                                date: formatCalendarDateUtc(
                                  `${vendor.lastDate}T00:00:00.000Z`,
                                ),
                              })}
                            </p>
                          </div>
                          {index === 0 && vendors.length > 1 && (
                            <Badge tone="info">
                              {t("materials.vendors.latest")}
                            </Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </div>
    </CollapsibleCard>
  )
}

import { useState } from "react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { Cable, Factory as FactoryIcon, Zap } from "lucide-react"
import {
  assignedFactoryOf,
  useVillaVendorsOfQuery,
} from "@/features/vendors/api"
import { toApiError } from "@/shared/api/errors"
import { Badge } from "@/shared/ui/Badge"
import CollapsibleCard from "@/shared/ui/CollapsibleCard"
import type { FactoryType } from "../api"

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
 * The villa's vendors, read from the Vendors page: the switchgear factory and the cable factory assigned to it. Its
 * deliveries and the delivery note form take these factories. Loaded the first time it is opened.
 */
export default function VillaVendorsCard({ villaId, villaNumber }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const query = useVillaVendorsOfQuery(open ? villaId : undefined)
  const vendors = query.data
  const assignedCount = vendors
    ? [vendors.switchgear, vendors.cable].filter(Boolean).length
    : 0

  return (
    <CollapsibleCard
      title={t("materials.vendors.title")}
      icon={FactoryIcon}
      open={open}
      onOpenChange={setOpen}
      badges={
        vendors && (
          <Badge tone={assignedCount === 2 ? "success" : "warn"}>
            {t("materials.vendors.assignedCount", { count: assignedCount })}
          </Badge>
        )
      }
    >
      <div className="grid gap-3">
        {query.isError ? (
          <p role="alert" className="text-sm text-danger">
            {toApiError(query.error).message}
          </p>
        ) : query.isLoading || !vendors ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {SECTIONS.map(({ type, labelKey, icon: SectionIcon }) => {
              const assigned = assignedFactoryOf(vendors, type)
              return (
                <section
                  key={type}
                  aria-label={t(labelKey)}
                  className="rounded-xl border border-border bg-muted/20 p-3"
                >
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <span className="grid size-7 place-items-center rounded-lg bg-accent/10 text-accent">
                      <SectionIcon size={15} strokeWidth={2} aria-hidden />
                    </span>
                    {t(labelKey)}
                  </h3>
                  {assigned ? (
                    <p className="flex items-center gap-2.5 rounded-lg bg-card px-2.5 py-2 text-sm font-medium shadow-xs">
                      <FactoryIcon
                        size={16}
                        strokeWidth={1.9}
                        className="shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <span className="truncate" dir="auto">
                        {assigned.name}
                      </span>
                    </p>
                  ) : (
                    <p className="py-2 text-sm text-muted-foreground">
                      {t("materials.vendors.notAssigned")}
                    </p>
                  )}
                </section>
              )
            })}
          </div>
        )}
        <Link
          to={`/vendors?search=${encodeURIComponent(villaNumber)}`}
          className="justify-self-start text-sm text-accent hover:underline"
        >
          {t("materials.vendors.openVendors")}
        </Link>
      </div>
    </CollapsibleCard>
  )
}

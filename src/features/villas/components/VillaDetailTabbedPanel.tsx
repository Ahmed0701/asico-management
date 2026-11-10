import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"
import type { VillaDetail } from "../api"
import { dashboardLinks } from "@/features/dashboard/lib/dashboardLinks"
import { usePermissions } from "@/features/auth/api"
import { Card } from "@/shared/ui/PageHeader"
import Tabs from "@/shared/ui/Tabs"
import VillaDetailOpenWorksPanel from "./VillaDetailOpenWorksPanel"
import VillaDetailSmallWorksPanel from "./VillaDetailSmallWorksPanel"
import VillaDetailSiteReportsPanel from "./VillaDetailSiteReportsPanel"
import VillaDetailDocumentsPanel from "./VillaDetailDocumentsPanel"
import VillaMaterialsPanel from "@/features/materials/components/VillaMaterialsPanel"

type VillaTab = "openWorks" | "smallWorks" | "siteReports" | "materials" | "documents" | "contractors"

const TAB_IDS: VillaTab[] = [
  "openWorks",
  "smallWorks",
  "siteReports",
  "materials",
  "documents",
  "contractors",
]

function tabFromSearch(value: string | null): VillaTab | undefined {
  if (!value) return undefined
  if (value === "dailyReports") return "contractors"
  return TAB_IDS.includes(value as VillaTab) ? value as VillaTab : undefined
}

export default function VillaDetailTabbedPanel({
  villa,
}: {
  villa: VillaDetail
}) {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const [searchParams] = useSearchParams()
  const showDocuments = can("villa-documents:download")
  const canDailyReports = can("daily-reports:read")
  const showMaterials = can("materials:read")
  const initialTab = useMemo(
    () => tabFromSearch(searchParams.get("tab")) ?? "openWorks",
    [searchParams],
  )
  const [tab, setTab] = useState<VillaTab>(initialTab)
  const highlightSmallWork = searchParams.get("highlightSmallWork") ?? undefined

  const location = useLocation()
  const panelRef = useRef<HTMLDivElement>(null)
  // A link elsewhere on the page (?tab=materials, with scrollToTabs in its state) opens that tab and brings the tabs into
  // view. It runs on every such click (each is a new location), even when the URL is already the same.
  const scrollToTabs = (location.state as { scrollToTabs?: number } | null)
    ?.scrollToTabs
  useEffect(() => {
    const fromUrl = tabFromSearch(searchParams.get("tab"))
    if (fromUrl) setTab(fromUrl)
    if (scrollToTabs) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [searchParams, scrollToTabs, location.key])

  const tabs = [
    { id: "openWorks" as const, label: t("villas.tabs.openWorksSchedule") },
    { id: "smallWorks" as const, label: t("villas.tabs.smallWorks") },
    { id: "siteReports" as const, label: t("villas.tabs.siteReports") },
    ...(showMaterials
      ? [{ id: "materials" as const, label: t("villas.tabs.materials") }]
      : []),
    ...(showDocuments
      ? [{ id: "documents" as const, label: t("villas.tabs.documents") }]
      : []),
    { id: "contractors" as const, label: t("villas.tabs.contractors") },
  ]

  return (
    <div ref={panelRef} className="scroll-mt-4">
      <Card className="p-4 sm:p-5">
        <Tabs value={tab} onChange={setTab} tabs={tabs} />
        {tab === "openWorks" && (
          <VillaDetailOpenWorksPanel villaId={villa.id} />
        )}
        {tab === "smallWorks" && (
          <VillaDetailSmallWorksPanel
            villaId={villa.id}
            highlightSmallWorkId={highlightSmallWork}
          />
        )}
        {tab === "siteReports" && (
          <VillaDetailSiteReportsPanel villaId={villa.id} />
        )}
        {tab === "materials" && showMaterials && (
          <VillaMaterialsPanel villaId={villa.id} />
        )}
        {tab === "documents" && showDocuments && (
          <VillaDetailDocumentsPanel villaId={villa.id} />
        )}
        {tab === "contractors" && (
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            {villa.contractor ? (
              <>
                <p className="text-sm font-medium" dir="auto">
                  {villa.contractor.name}
                </p>
                <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
                  {villa.contractor.phone}
                </p>
                <Link
                  to={`/contractors/${villa.contractor.id}`}
                  className="mt-3 inline-block text-sm text-accent hover:underline"
                >
                  {t("villas.viewContractor")}
                </Link>
                {canDailyReports && (
                  <Link
                    to={dashboardLinks.dailyReportsByContractor(
                      villa.contractor.id,
                    )}
                    className="mt-2 block text-sm text-accent hover:underline"
                  >
                    {t("villas.viewContractorDailyReports")}
                  </Link>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("villas.noContractorAssigned")}
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

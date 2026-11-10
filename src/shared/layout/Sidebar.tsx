import { NavLink, useMatch } from "react-router"
import { useTranslation } from "react-i18next"
import {
  BellRing,
  Building2,
  ClipboardCheck,
  ClipboardList,
  Hammer,
  HardHat,
  LayoutDashboard,
  Map,
  NotebookPen,
  Package,
  Shield,
  ShieldCheck,
  Toolbox,
  UserCog,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { usePermissions, NAV_ITEM_PERMISSIONS } from "@/features/auth/api"
import { cn } from "../lib/cn"
import { useUiDirection } from "../lib/useUiDirection"
import { useUiStore } from "../lib/store"
import Icon from "../ui/Icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import Brand from "./Brand"
import SidebarVillasExportButton from "./SidebarVillasExportButton"
import { useSidebarCounts } from "./useSidebarCounts"

interface Item {
  to: string
  key: string
  end?: boolean
}

const NAV_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  villas: Building2,
  villaOpenWorks: ClipboardList,
  dailyReports: NotebookPen,
  smallWorks: Hammer,
  siteReports: ShieldCheck,
  areas: Map,
  elecPhases: Zap,
  mewFollowUp: BellRing,
  mewInspection: ClipboardCheck,
  maintenance: Toolbox,
  materials: Package,
  contractors: HardHat,
  civilEngineers: Wrench,
  electricalEngineers: UserCog,
  users: Users,
  permissions: Shield,
}

const groups: {
  key: string
  items: Item[]
}[] = [
  {
    key: "workspace",
    items: [
      { to: "/", key: "dashboard", end: true },
      { to: "/villas", key: "villas", end: true },
    ],
  },
  {
    key: "sitePreview",
    items: [
      { to: "/villas/open-works", key: "villaOpenWorks" },
      { to: "/daily-reports", key: "dailyReports" },
      { to: "/small-works", key: "smallWorks" },
      { to: "/site-reports", key: "siteReports" },
      { to: "/areas", key: "areas" },
      { to: "/elec-phases", key: "elecPhases" },
      { to: "/villas/mew-follow-up", key: "mewFollowUp" },
      { to: "/villas/mew-inspection", key: "mewInspection" },
      { to: "/maintenance", key: "maintenance" },
      { to: "/materials", key: "materials" },
    ],
  },
  {
    key: "directory",
    items: [
      { to: "/contractors", key: "contractors" },
      { to: "/electrical-engineers", key: "electricalEngineers" },
      { to: "/civil-engineers", key: "civilEngineers" },
    ],
  },
  {
    key: "administration",
    items: [
      { to: "/users", key: "users" },
      { to: "/permissions", key: "permissions" },
      { to: "/audit", key: "auditLog" },
    ],
  },
]

const NAV_ICON_SIZE = 19
const NAV_ICON_STROKE = 1.75

function SidebarNavIcon({ itemKey }: { itemKey: string }) {
  const Lucide = NAV_ICONS[itemKey]
  if (Lucide) {
    return (
      <Lucide
        size={NAV_ICON_SIZE}
        strokeWidth={NAV_ICON_STROKE}
        className="block shrink-0"
        aria-hidden
      />
    )
  }
  return <Icon name="log" size={NAV_ICON_SIZE} className="block shrink-0" />
}

// A count of 100 or more is shown as 99+, so the badge keeps its size.
const countText = (count: number): string =>
  count > 99 ? "99+" : String(count)

function SidebarNavItem({
  item,
  collapsed,
  label,
  count,
  onNavigate,
}: {
  item: Item
  collapsed: boolean
  label: string
  count?: number
  onNavigate: () => void
}) {
  const direction = useUiDirection()
  const tooltipSide = direction === "rtl" ? "left" : "right"
  const isActive = Boolean(useMatch({ path: item.to, end: item.end ?? false }))

  const linkClassName = cn(
    "flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
    collapsed &&
      "lg:!grid lg:size-9 lg:shrink-0 lg:place-items-center lg:gap-0 lg:p-0",
    isActive
      ? "bg-accent text-accent-foreground hover:bg-accent/90 hover:text-accent-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  )

  const link = (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={linkClassName}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="relative">
        <SidebarNavIcon itemKey={item.key} />
        {collapsed && count !== undefined && count > 0 && (
          <span className="absolute -end-2 -top-1.5 hidden min-w-4 rounded-full bg-danger px-1 text-center text-[10px] font-semibold leading-4 text-white tabular-nums lg:block">
            {countText(count)}
          </span>
        )}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-start",
          collapsed && "lg:hidden",
        )}
      >
        {label}
      </span>
      {count !== undefined && (
        <span
          className={cn(
            "ms-auto min-w-6 shrink-0 rounded-full px-1.5 text-center text-xs font-semibold leading-5 tabular-nums",
            isActive
              ? "bg-accent-foreground/20 text-accent-foreground"
              : count > 0
                ? "bg-accent/15 text-accent"
                : "bg-muted text-muted-foreground",
            collapsed && "lg:hidden",
          )}
          aria-label={`${count}`}
        >
          {countText(count)}
        </span>
      )}
    </NavLink>
  )

  if (!collapsed) return link

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent
        side={tooltipSide}
        align="center"
        className="max-lg:hidden"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

export default function Sidebar() {
  const { t } = useTranslation()
  const counts = useSidebarCounts()
  const { can } = usePermissions()
  const direction = useUiDirection()
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  /** Scrollbar on the viewport-adjacent edge (right in AR, left in EN). */
  const navScrollDir = direction === "rtl" ? "ltr" : "rtl"
  const mobileOpen = useUiStore((s) => s.mobileOpen)
  const setMobileOpen = useUiStore((s) => s.setMobileOpen)

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden [animate-[fade-in_.15s]"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 inset-s-0 z-40 flex w-60 flex-col border-e border-border bg-card transition-all duration-200 lg:sticky lg:top-0 lg:z-10 lg:h-screen lg:translate-x-0",
          mobileOpen
            ? "translate-x-0"
            : "max-lg:-translate-x-full max-lg:rtl:translate-x-full",
          collapsed && "lg:w-17",
        )}
      >
        <div
          className={cn(
            "flex h-14 items-center border-b border-border px-4",
            collapsed && "lg:justify-center lg:px-0",
          )}
        >
          <span className={cn(collapsed && "lg:hidden")}>
            <Brand />
          </span>
          {collapsed && (
            <span className="hidden lg:block">
              <Brand compact />
            </span>
          )}
        </div>
        <nav className="flex min-h-0 flex-1 flex-col" aria-label="Main">
          <div
            dir={navScrollDir}
            className={cn(
              "min-h-0 flex-1 overflow-y-auto py-4",
              direction === "rtl" ? "ps-3 pe-3" : "ps-3 pe-3",
              collapsed && "lg:px-2",
            )}
          >
            <div dir={direction}>
              {groups.map((g) => {
                const visibleItems = g.items.filter((item) => {
                  const perm = NAV_ITEM_PERMISSIONS[item.key]
                  return !perm || can(perm)
                })
                if (visibleItems.length === 0) return null
                return (
                  <div key={g.key} className="mb-5">
                    <p
                      className={cn(
                        "mb-1.5 px-3 text-start text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
                        collapsed && "lg:hidden",
                      )}
                    >
                      {t(`nav.${g.key}`)}
                    </p>
                    {collapsed && (
                      <div className="mb-2 hidden border-t border-border lg:mx-2 lg:block" />
                    )}
                    <ul className="space-y-0.5">
                      {visibleItems.map((item) => (
                        <li
                          key={item.to}
                          className={cn(
                            collapsed && "lg:flex lg:justify-center",
                          )}
                        >
                          <SidebarNavItem
                            item={item}
                            collapsed={collapsed}
                            label={t(`nav.${item.key}`)}
                            count={counts[item.key]}
                            onNavigate={() => setMobileOpen(false)}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
          <div
            className={cn(
              "shrink-0 border-t border-border p-3",
              collapsed && "lg:px-2",
            )}
          >
            <SidebarVillasExportButton collapsed={collapsed} />
          </div>
        </nav>
      </aside>
    </>
  )
}

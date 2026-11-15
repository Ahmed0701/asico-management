import { useState } from "react"
import { NavLink, useMatch, useLocation, matchPath } from "react-router"
import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
import { usePermissions, NAV_ITEM_PERMISSIONS } from "@/features/auth/api"
import { cn } from "../lib/cn"
import { useUiDirection } from "../lib/useUiDirection"
import { useUiStore } from "../lib/store"
import Icon from "../ui/Icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import Brand from "./Brand"
import SidebarVillasExportButton from "./SidebarVillasExportButton"
import { NAV_GROUPS, NAV_ICONS, type NavGroup, type NavItem } from "./navItems"
import { useSidebarCounts } from "./useSidebarCounts"

type Item = NavItem
type Group = NavGroup

const NAV_ICON_SIZE = 17
const NAV_ICON_STROKE = 1.9
// Which groups are folded, kept in this browser only (a convenience: the menu works the same without it).
const FOLDED_KEY = "asico-sidebar-folded"

function readFolded(): string[] {
  try {
    const raw = localStorage.getItem(FOLDED_KEY)
    const value: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(value)
      ? value.filter((v): v is string => typeof v === "string")
      : []
  } catch {
    return []
  }
}

function writeFolded(keys: string[]): void {
  try {
    localStorage.setItem(FOLDED_KEY, JSON.stringify(keys))
  } catch {
    // Private window or blocked storage: the fold is just not remembered.
  }
}

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

type NavItemProps = {
  item: Item
  collapsed: boolean
  label: string
  count?: number
  onNavigate: () => void
}

function SidebarNavItem({
  item,
  collapsed,
  label,
  count,
  onNavigate,
}: NavItemProps) {
  const direction = useUiDirection()
  const tooltipSide = direction === "rtl" ? "left" : "right"
  const isActive = Boolean(useMatch({ path: item.to, end: item.end ?? false }))
  const hasCount = count !== undefined && count > 0

  const link = (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group/item relative flex h-10 w-full items-center gap-3 rounded-xl ps-2 pe-2.5 text-sm font-medium outline-none transition-all duration-200",
        "focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        collapsed &&
          "lg:!grid lg:size-11 lg:shrink-0 lg:place-items-center lg:gap-0 lg:p-0",
        isActive
          ? "bg-accent/10 text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_22%,transparent)]"
          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
      )}
    >
      {/* The bar on the inline-start edge of the page you are on. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-2 -start-3 w-1 rounded-e-full bg-accent transition-all duration-200",
          isActive ? "opacity-100" : "scale-y-0 opacity-0",
          collapsed && "lg:-start-2",
        )}
      />
      <span
        className={cn(
          "relative grid size-7 shrink-0 place-items-center rounded-lg transition-all duration-200",
          isActive
            ? "bg-accent text-accent-foreground shadow-sm shadow-accent/30"
            : "bg-muted/70 text-muted-foreground group-hover/item:bg-card group-hover/item:text-accent group-hover/item:shadow-sm",
          collapsed && "lg:size-9 lg:rounded-xl",
        )}
      >
        <span className="transition-transform duration-200 group-hover/item:scale-110">
          <SidebarNavIcon itemKey={item.key} />
        </span>
        {collapsed && hasCount && (
          <span className="absolute -end-1.5 -top-1.5 hidden min-w-4 rounded-full bg-accent px-1 text-center text-[10px] font-bold leading-4 text-accent-foreground ring-2 ring-card tabular-nums lg:block">
            {countText(count)}
          </span>
        )}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-start",
          isActive && "font-semibold",
          collapsed && "lg:hidden",
        )}
      >
        {label}
      </span>
      {count !== undefined && (
        <span
          className={cn(
            "ms-auto min-w-6 shrink-0 rounded-full px-1.5 text-center text-[11px] font-semibold leading-5 tabular-nums transition-colors",
            isActive
              ? "bg-accent text-accent-foreground"
              : hasCount
                ? "bg-accent/12 text-accent"
                : "bg-muted text-muted-foreground/80",
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
        {hasCount ? `${label} (${countText(count)})` : label}
      </TooltipContent>
    </Tooltip>
  )
}

type NavGroupProps = {
  group: Group
  items: Item[]
  collapsed: boolean
  folded: boolean
  holdsCurrentPage: boolean
  counts: Record<string, number | undefined>
  onToggle: () => void
  onNavigate: () => void
}

function SidebarNavGroup({
  group,
  items,
  collapsed,
  folded,
  holdsCurrentPage,
  counts,
  onToggle,
  onNavigate,
}: NavGroupProps) {
  const { t } = useTranslation()
  // The group of the page you are on stays open; a collapsed menu shows every icon.
  const open = collapsed || holdsCurrentPage || !folded
  const waiting = items.reduce((sum, item) => sum + (counts[item.key] ?? 0), 0)
  const listId = `nav-group-${group.key}`

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={onToggle}
        disabled={holdsCurrentPage}
        aria-expanded={open}
        aria-controls={listId}
        className={cn(
          "group/head mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1 text-start outline-none",
          "focus-visible:ring-2 focus-visible:ring-accent/60",
          !holdsCurrentPage && "cursor-pointer hover:text-foreground",
          collapsed && "lg:hidden",
        )}
      >
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/90 group-hover/head:text-foreground">
          {t(`nav.${group.key}`)}
        </span>
        <span
          aria-hidden
          className="h-px flex-1 bg-gradient-to-r from-border to-transparent rtl:bg-gradient-to-l"
        />
        {!open && waiting > 0 && (
          <span className="rounded-full bg-accent/12 px-1.5 text-[10px] font-semibold leading-4 text-accent tabular-nums">
            {countText(waiting)}
          </span>
        )}
        {!holdsCurrentPage && (
          <ChevronDown
            size={14}
            strokeWidth={2}
            aria-hidden
            className={cn(
              "shrink-0 text-muted-foreground/70 transition-transform duration-200",
              !open && "-rotate-90 rtl:rotate-90",
            )}
          />
        )}
      </button>
      {collapsed && (
        <div className="mx-auto mb-2 hidden h-px w-6 bg-border lg:block" />
      )}
      <div
        id={listId}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <ul className="min-h-0 space-y-0.5 overflow-hidden ps-0.5">
          {items.map((item) => (
            <li
              key={item.to}
              className={cn(collapsed && "lg:flex lg:justify-center")}
            >
              <SidebarNavItem
                item={item}
                collapsed={collapsed}
                label={t(`nav.${item.key}`)}
                count={counts[item.key]}
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const counts = useSidebarCounts()
  const { can } = usePermissions()
  const direction = useUiDirection()
  const { pathname } = useLocation()
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  /** Scrollbar on the viewport-adjacent edge (right in AR, left in EN). */
  const navScrollDir = direction === "rtl" ? "ltr" : "rtl"
  const mobileOpen = useUiStore((s) => s.mobileOpen)
  const setMobileOpen = useUiStore((s) => s.setMobileOpen)
  const [folded, setFolded] = useState<string[]>(readFolded)

  const toggle = (key: string) =>
    setFolded((current) => {
      const next = current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key]
      writeFolded(next)
      return next
    })

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] lg:hidden [animate-[fade-in_.15s]"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 inset-s-0 z-40 flex w-64 flex-col overflow-hidden border-e border-border bg-card transition-all duration-200 lg:sticky lg:top-0 lg:z-10 lg:h-screen lg:translate-x-0",
          "bg-[linear-gradient(180deg,var(--card)_0%,color-mix(in_oklab,var(--card)_86%,var(--background))_100%)]",
          mobileOpen
            ? "translate-x-0 shadow-2xl"
            : "max-lg:-translate-x-full max-lg:rtl:translate-x-full",
          collapsed && "lg:w-[76px]",
        )}
      >
        {/* A soft glow of the accent behind the brand. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 start-[-30%] size-64 rounded-full bg-accent/10 blur-3xl"
        />
        <div
          className={cn(
            "relative flex h-16 shrink-0 items-center border-b border-border/70 px-4",
            collapsed && "lg:justify-center lg:px-0",
          )}
        >
          <span className={cn(collapsed && "lg:hidden")}>
            <Brand withTagline />
          </span>
          {collapsed && (
            <span className="hidden lg:block">
              <Brand compact />
            </span>
          )}
        </div>
        <nav
          className="relative flex min-h-0 flex-1 flex-col"
          aria-label="Main"
        >
          <div
            dir={navScrollDir}
            className={cn(
              "min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]",
              "[mask-image:linear-gradient(to_bottom,transparent,black_14px,black_calc(100%-18px),transparent)]",
              collapsed && "lg:px-2",
            )}
          >
            <div dir={direction}>
              {NAV_GROUPS.map((g) => {
                const visibleItems = g.items.filter((item) => {
                  const perm = NAV_ITEM_PERMISSIONS[item.key]
                  return !perm || can(perm)
                })
                if (visibleItems.length === 0) return null
                const holdsCurrentPage = visibleItems.some((item) =>
                  Boolean(
                    matchPath(
                      { path: item.to, end: item.end ?? false },
                      pathname,
                    ),
                  ),
                )
                return (
                  <SidebarNavGroup
                    key={g.key}
                    group={g}
                    items={visibleItems}
                    collapsed={collapsed}
                    folded={folded.includes(g.key)}
                    holdsCurrentPage={holdsCurrentPage}
                    counts={counts}
                    onToggle={() => toggle(g.key)}
                    onNavigate={() => setMobileOpen(false)}
                  />
                )
              })}
            </div>
          </div>
          <div
            className={cn(
              "shrink-0 border-t border-border/70 p-3",
              collapsed && "lg:px-2",
            )}
          >
            <div
              className={cn(
                "rounded-xl border border-border/80 bg-muted/40 p-1 shadow-xs",
                collapsed &&
                  "lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none",
              )}
            >
              <SidebarVillasExportButton collapsed={collapsed} />
            </div>
          </div>
        </nav>
      </aside>
    </>
  )
}

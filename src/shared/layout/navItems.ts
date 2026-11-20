import {
  Boxes,
  Factory,
  BriefcaseBusiness,
  BellRing,
  Building2,
  ClipboardCheck,
  ClipboardList,
  Hammer,
  Landmark,
  HardHat,
  LayoutDashboard,
  ListTodo,
  Map,
  NotebookPen,
  Package,
  ScrollText,
  Shield,
  ShieldCheck,
  StickyNote,
  Toolbox,
  TrendingUp,
  UserCog,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react"

/** One page of the main menu: its path, its key (`nav.<key>` is its label), and whether only the exact path matches. */
export interface NavItem {
  to: string
  key: string
  end?: boolean
}

/** A section of the main menu (`nav.<key>` is its title). */
export type NavGroup = {
  key: string
  items: NavItem[]
}

export const NAV_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  villas: Building2,
  villaOpenWorks: ClipboardList,
  dailyReports: NotebookPen,
  smallWorks: Hammer,
  siteReports: ShieldCheck,
  areas: Map,
  elecPhases: Zap,
  materialItems: Boxes,
  mewFollowUp: BellRing,
  mewInspection: ClipboardCheck,
  maintenance: Toolbox,
  ownerNotes: StickyNote,
  foremanMissions: ListTodo,
  monthlyProgress: TrendingUp,
  projectBudgets: Landmark,
  departmentOverhead: BriefcaseBusiness,
  materials: Package,
  vendors: Factory,
  contractors: HardHat,
  civilEngineers: Wrench,
  electricalEngineers: UserCog,
  users: Users,
  permissions: Shield,
  auditLog: ScrollText,
}

export const NAV_GROUPS: NavGroup[] = [
  {
    key: "workspace",
    items: [
      { to: "/", key: "dashboard", end: true },
      { to: "/villas", key: "villas", end: true },
      { to: "/monthly-progress", key: "monthlyProgress" },
      { to: "/project-budgets", key: "projectBudgets" },
      { to: "/department-overhead", key: "departmentOverhead" },
      { to: "/materials", key: "materials" },
      { to: "/vendors", key: "vendors" },
    ],
  },
  {
    key: "sitePreview",
    items: [
      { to: "/villas/open-works", key: "villaOpenWorks" },
      { to: "/daily-reports", key: "dailyReports" },
      { to: "/small-works", key: "smallWorks" },
      { to: "/site-reports", key: "siteReports" },
      { to: "/villas/mew-follow-up", key: "mewFollowUp" },
      { to: "/villas/mew-inspection", key: "mewInspection" },
      { to: "/maintenance", key: "maintenance" },
      { to: "/owner-notes", key: "ownerNotes" },
      { to: "/foreman-missions", key: "foremanMissions" },
    ],
  },
  {
    key: "directory",
    items: [
      { to: "/contractors", key: "contractors" },
      { to: "/electrical-engineers", key: "electricalEngineers" },
      { to: "/civil-engineers", key: "civilEngineers" },
      { to: "/areas", key: "areas" },
      { to: "/elec-phases", key: "elecPhases" },
      { to: "/material-items", key: "materialItems" },
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

/** A menu page and the section it is in. */
export type NavMatch = {
  item: NavItem
  group: NavGroup
}

/**
 * The menu page a path belongs to, and its section: the longest menu path the path is, or is under ("/villas/12" is under
 * "/villas"). The dashboard ("/") matches only itself. Undefined for a page that is not in the menu (the profile).
 */
export function findNavItem(pathname: string): NavMatch | undefined {
  let best: NavMatch | undefined
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      const matches =
        item.to === "/"
          ? pathname === "/"
          : pathname === item.to || pathname.startsWith(`${item.to}/`)
      if (matches && (!best || item.to.length > best.item.to.length)) {
        best = { item, group }
      }
    }
  }
  return best
}

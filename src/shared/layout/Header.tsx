import { CalendarDays, LogOut } from "lucide-react"
import { useLocation, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { useLogoutMutation, useMeQuery } from "@/features/auth/api"
import NotificationBell from "@/features/notifications/components/NotificationBell"
import { cn } from "../lib/cn"
import { useUiStore } from "../lib/store"
import { IconButton } from "../ui/Button"
import Icon from "../ui/Icon"
import Menu, { MenuItem } from "../ui/Menu"
import { NAV_ICONS, findNavItem } from "./navItems"

// The look every round button of the header shares: a small tile like the sidebar's icons.
const TILE =
  "size-9 rounded-xl border border-border/70 bg-card/80 text-muted-foreground shadow-xs transition-all duration-200 hover:border-accent/30 hover:bg-card hover:text-accent hover:shadow-sm"

// The page you are on, as the sidebar names it: its icon tile, its section, and its name.
function CurrentPage() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const found = findNavItem(pathname)
  if (!found) return null
  const PageIcon = NAV_ICONS[found.item.key]
  return (
    <div className="hidden min-w-0 items-center gap-3 sm:flex">
      {PageIcon && (
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground shadow-sm shadow-accent/30">
          <PageIcon size={18} strokeWidth={1.9} aria-hidden />
        </span>
      )}
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t(`nav.${found.group.key}`)}
        </p>
        <p className="truncate text-[15px] font-semibold tracking-tight">
          {t(`nav.${found.item.key}`)}
        </p>
      </div>
    </div>
  )
}

// Today, in the language of the page: "Sunday, 15 November 2026".
function TodayChip() {
  const { i18n } = useTranslation()
  const text = new Intl.DateTimeFormat(
    i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  ).format(new Date())
  return (
    <span className="hidden items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-xs xl:inline-flex">
      <CalendarDays
        size={14}
        strokeWidth={1.9}
        className="text-accent"
        aria-hidden
      />
      {text}
    </span>
  )
}

export default function Header() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    theme,
    toggleTheme,
    lang,
    setLang,
    toggleSidebar,
    setMobileOpen,
    sidebarCollapsed,
  } = useUiStore()
  const { data: user } = useMeQuery()
  const logout = useLogoutMutation()

  const displayName = user?.name ?? ""
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => navigate("/login", { replace: true }),
    })
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/70 px-4 backdrop-blur-md lg:px-6",
        "bg-[linear-gradient(180deg,color-mix(in_oklab,var(--card)_92%,transparent)_0%,color-mix(in_oklab,var(--card)_78%,transparent)_100%)]",
      )}
    >
      {/* A thin line of the accent along the bottom, fading out, like the sidebar's glow. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-accent/50 via-accent/15 to-transparent rtl:bg-gradient-to-l"
      />
      <IconButton
        icon="menu"
        label={t("nav.openMenu")}
        className={cn(TILE, "lg:hidden")}
        onClick={() => setMobileOpen(true)}
      />
      <IconButton
        icon="panel"
        label={t(sidebarCollapsed ? "nav.expand" : "nav.collapse")}
        className={cn(TILE, "hidden lg:inline-flex")}
        onClick={toggleSidebar}
      />
      <span aria-hidden className="mx-1 hidden h-6 w-px bg-border lg:block" />

      <CurrentPage />

      <div className="flex-1" />

      <TodayChip />

      <div
        role="group"
        aria-label={t("header.language")}
        className="flex rounded-xl border border-border/70 bg-muted/60 p-0.5 text-xs font-semibold shadow-xs"
      >
        {(["en", "ar"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
            className={cn(
              "rounded-[10px] px-2.5 py-1.5 transition-all duration-200",
              lang === l
                ? "bg-accent text-accent-foreground shadow-sm shadow-accent/30"
                : "text-muted-foreground hover:bg-card hover:text-foreground",
            )}
          >
            {l === "en" ? t("header.english") : t("header.arabic")}
          </button>
        ))}
      </div>

      <NotificationBell buttonClassName={TILE} />

      <IconButton
        icon={theme === "light" ? "moon" : "sun"}
        label={t("header.theme")}
        className={TILE}
        onClick={toggleTheme}
      />

      <Menu
        label={t("header.userMenu")}
        trigger={
          <span className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-card/80 py-1 ps-1 pe-2.5 shadow-xs transition-all duration-200 hover:border-accent/30 hover:bg-card hover:shadow-sm">
            <span className="relative grid size-8 place-items-center rounded-lg bg-[linear-gradient(135deg,var(--accent),color-mix(in_oklab,var(--accent)_65%,var(--primary)))] text-xs font-bold text-accent-foreground shadow-sm">
              {initials}
              <span
                aria-hidden
                className="absolute -bottom-0.5 -end-0.5 size-2.5 rounded-full bg-success ring-2 ring-card"
              />
            </span>
            <span className="hidden min-w-0 flex-col text-start leading-tight sm:flex">
              <span className="max-w-32 truncate text-sm font-semibold">
                {displayName}
              </span>
              {user?.role && (
                <span className="text-[11px] text-muted-foreground">
                  {t(`roles.${user.role}`)}
                </span>
              )}
            </span>
            <Icon
              name="chevronDown"
              size={14}
              className="text-muted-foreground"
            />
          </span>
        }
      >
        {(close) => (
          <>
            <div className="flex items-center gap-3 border-b border-border px-3 py-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[linear-gradient(135deg,var(--accent),color-mix(in_oklab,var(--accent)_65%,var(--primary)))] text-xs font-bold text-accent-foreground">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
            <MenuItem
              onClick={() => {
                close()
                navigate("/profile")
              }}
            >
              <Icon name="user" size={16} />
              {t("header.profile")}
            </MenuItem>
            <MenuItem
              onClick={() => {
                close()
                navigate("/change-password")
              }}
            >
              <Icon name="key" size={16} />
              {t("header.changePassword")}
            </MenuItem>
            <MenuItem
              danger
              onClick={() => {
                close()
                handleLogout()
              }}
            >
              <LogOut
                size={16}
                strokeWidth={1.75}
                className="rtl:-scale-x-100"
              />
              {t("header.logout")}
            </MenuItem>
          </>
        )}
      </Menu>
    </header>
  )
}

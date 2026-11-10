import { LogOut } from "lucide-react"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { useLogoutMutation, useMeQuery } from "@/features/auth/api"
import { cn } from "../lib/cn"
import { useUiStore } from "../lib/store"
import { IconButton } from "../ui/Button"
import Icon from "../ui/Icon"
import Menu, { MenuItem } from "../ui/Menu"
import NotificationBell from "@/features/notifications/components/NotificationBell"

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
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur lg:px-6">
      <IconButton
        icon="menu"
        label={t("nav.openMenu")}
        className="lg:hidden"
        onClick={() => setMobileOpen(true)}
      />
      <IconButton
        icon="panel"
        label={t(sidebarCollapsed ? "nav.expand" : "nav.collapse")}
        className="hidden lg:inline-flex"
        onClick={toggleSidebar}
      />
      <div className="flex-1" />

      <div
        role="group"
        aria-label={t("header.language")}
        className="flex rounded-lg border border-border bg-card p-0.5 text-xs font-medium"
      >
        {(["en", "ar"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
            className={cn(
              "rounded-md px-2.5 py-1 transition",
              lang === l
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l === "en" ? t("header.english") : t("header.arabic")}
          </button>
        ))}
      </div>

      <NotificationBell />

      <IconButton
        icon={theme === "light" ? "moon" : "sun"}
        label={t("header.theme")}
        onClick={toggleTheme}
      />

      <Menu
        label={t("header.userMenu")}
        trigger={
          <span className="flex items-center gap-2 rounded-lg p-1 pe-2 transition hover:bg-muted">
            <span className="grid size-7 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
              {initials}
            </span>
            <span className="hidden max-w-32 truncate text-sm font-medium sm:block">
              {displayName}
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
            <div className="border-b border-border px-3 py-2">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
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

import { Outlet } from "react-router"
import { useTranslation } from "react-i18next"
import { useUiStore } from "../lib/store"
import { IconButton } from "../ui/Button"
import Brand from "./Brand"

export default function AuthLayout() {
  const { t } = useTranslation()
  const { lang, setLang, theme, toggleTheme } = useUiStore()
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <Brand />
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            {t("auth.heroTitle")}
          </h2>
          <p className="mt-4 text-primary-foreground/70">
            {t("auth.heroBody")}
          </p>
        </div>
        <svg
          className="absolute inset-x-0 bottom-0 w-full text-accent/40"
          viewBox="0 0 600 220"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          aria-hidden="true"
        >
          {Array.from({ length: 9 }, (_, i) => (
            <path
              key={i}
              d={`M${i * 70 - 10} 220V${150 - ((i * 37) % 80)}h60V220M${i * 70 + 10} ${150 - ((i * 37) % 80)}l20-26 20 26`}
            />
          ))}
        </svg>
        <p className="relative z-10 text-xs text-primary-foreground/50">
          {t("app.tagline")}
        </p>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-4">
          <span className="lg:invisible">
            <Brand />
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              {lang === "en" ? "العربية" : "English"}
            </button>
            <IconButton
              icon={theme === "light" ? "moon" : "sun"}
              label={t("header.theme")}
              onClick={toggleTheme}
            />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

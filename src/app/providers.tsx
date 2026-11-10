import { QueryClientProvider } from "@tanstack/react-query"
import { useEffect, type ReactNode } from "react"
import { I18nextProvider } from "react-i18next"
import SessionBootstrap from "@/features/auth/components/SessionBootstrap"
import { createAppQueryClient } from "@/shared/api/queryClient"
import i18n from "@/shared/i18n"
import { useUiStore } from "@/shared/lib/store"
import { ExportProvider } from "@/shared/export/ExportProvider"
import { Toaster } from "@/shared/ui/sonner"

const queryClient = createAppQueryClient()

export default function Providers({ children }: { children: ReactNode }) {
  const theme = useUiStore((s) => s.theme)
  const lang = useUiStore((s) => s.lang)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", theme === "dark")
    root.style.colorScheme = theme
  }, [theme])

  useEffect(() => {
    if (i18n.language !== lang) {
      void i18n.changeLanguage(lang)
    }
    const root = document.documentElement
    root.lang = lang
    root.dir = lang === "ar" ? "rtl" : "ltr"
    document.title = i18n.t("app.name") + " | " + i18n.t("app.tagline")
  }, [lang])

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ExportProvider>
          <SessionBootstrap>{children}</SessionBootstrap>
          <Toaster />
        </ExportProvider>
      </I18nextProvider>
    </QueryClientProvider>
  )
}

export { queryClient }

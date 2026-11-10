import { create } from "zustand"
import { persist } from "zustand/middleware"
import i18n, { type Lang } from "../i18n"

export type Theme = "light" | "dark"

interface UiState {
  theme: Theme
  lang: Lang
  sidebarCollapsed: boolean
  mobileOpen: boolean
  toggleTheme: () => void
  setLang: (lang: Lang) => void
  toggleSidebar: () => void
  setMobileOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: "light",
      lang: i18n.language === "ar" ? "ar" : "en",
      sidebarCollapsed: false,
      mobileOpen: false,
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
      setLang: (lang) => {
        localStorage.setItem("asico-lang", lang)
        void i18n.changeLanguage(lang)
        set({ lang })
      },
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileOpen: (mobileOpen) => set({ mobileOpen }),
    }),
    {
      name: "asico-ui",
      partialize: (s) => ({
        theme: s.theme,
        sidebarCollapsed: s.sidebarCollapsed,
        lang: s.lang,
      }),
    },
  ),
)

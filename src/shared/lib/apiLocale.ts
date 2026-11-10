import { useUiStore } from "./store"

export type ApiLocale = "en" | "ar"

export function useApiLocale(): ApiLocale {
  return useUiStore((s) => s.lang)
}

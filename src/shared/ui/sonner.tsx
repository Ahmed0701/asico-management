import { Toaster as Sonner, type ToasterProps } from "sonner"

import { useUiStore } from "@/shared/lib/store"

export function Toaster({ ...props }: ToasterProps) {
  const theme = useUiStore((s) => s.theme)

  const lang = useUiStore((s) => s.lang)

  const isRtl = lang === "ar"

  return (
    <Sonner
      theme={theme === "dark" ? "dark" : "light"}
      dir={isRtl ? "rtl" : "ltr"}
      position={isRtl ? "top-left" : "top-right"}
      richColors
      closeButton
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",

          "--normal-text": "var(--popover-foreground)",

          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

import { cn } from "./utils"

/** Shared border, focus, error, and surface styles for text-like controls. */
export const fieldControlClassName = cn(
  "border border-input-border bg-input-background text-foreground",
  "placeholder:text-muted-foreground",
  "transition-[color,box-shadow] outline-none",
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
  "dark:aria-invalid:ring-destructive/40 dark:bg-input/30",
  "disabled:cursor-not-allowed disabled:opacity-50",
)

/** Native select and legacy Field controls (rounded-lg to match existing legacy forms). */
export const legacyNativeControlClassName = cn(
  fieldControlClassName,
  "w-full rounded-lg px-3 text-sm",
)

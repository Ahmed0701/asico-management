import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "../lib/cn"

export default function Menu({
  trigger,
  children,
  align = "end",
  label,
  disabled = false,
}: {
  trigger: ReactNode
  children: (close: () => void) => ReactNode
  align?: "start" | "end"
  label: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) =>
      !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className="rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute top-full z-40 mt-2 min-w-48 rounded-lg border border-border bg-card p-1 shadow-xl [animation:pop-in_.15s_ease-out]",
            align === "end" ? "end-0" : "start-0",
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export function MenuItem({
  children,
  onClick,
  danger,
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50",
        danger && "text-danger",
      )}
    >
      {children}
    </button>
  )
}

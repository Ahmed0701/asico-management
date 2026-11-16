import { useId, useState, type ReactNode } from "react"
import { ChevronDown, type LucideIcon } from "lucide-react"
import { cn } from "@/shared/lib/cn"
import { Card } from "@/shared/ui/PageHeader"

type Props = {
  title: string
  icon: LucideIcon
  // Short facts beside the title (counts, status), shown open or closed.
  badges?: ReactNode
  // A line under the title, shown open or closed.
  subtitle?: string
  defaultOpen?: boolean
  // Controlled: the parent decides (a link that opens the card, for example).
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
}

/**
 * A card that folds: an icon tile, the title and its badges, and a chevron. The body slides open and closed; it is only
 * rendered while open, so whatever it loads waits until it is opened.
 */
export default function CollapsibleCard({
  title,
  icon: CardIcon,
  badges,
  subtitle,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  children,
}: Props) {
  const [ownOpen, setOwnOpen] = useState(defaultOpen)
  const open = controlledOpen ?? ownOpen
  const bodyId = useId()
  const toggle = () => {
    const next = !open
    if (controlledOpen === undefined) setOwnOpen(next)
    onOpenChange?.(next)
  }

  return (
    <Card className="group/collapsible mb-4 overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={toggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-start outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 sm:px-5"
      >
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl transition-colors duration-200",
            open
              ? "bg-accent text-accent-foreground shadow-sm shadow-accent/30"
              : "bg-accent/10 text-accent",
          )}
        >
          <CardIcon size={17} strokeWidth={1.9} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{title}</span>
            {badges}
          </span>
          {subtitle && (
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {subtitle}
            </span>
          )}
        </span>
        <span className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors group-hover/collapsible:bg-muted">
          <ChevronDown
            size={17}
            aria-hidden
            className={cn(
              "transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </span>
      </button>
      <div
        id={bodyId}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          {open && (
            <div className="border-t border-border/70 p-4 sm:p-5">
              {children}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

import type { ReactNode } from "react"
import { Link } from "react-router"
import { Building2 } from "lucide-react"
import { cn } from "@/shared/lib/cn"

/** Up to two initials of a name ("Mona Hassan" → "MH"). */
export const initialsOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()

/** A round tile with a person's initials. */
type AvatarProps = {
  name: string
  className?: string
}

export function Avatar({ name, className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground",
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  )
}

/** A person in a list cell: their initials and their name ("-" when there is none). */
export function PersonCell({ name }: { name: string | null | undefined }) {
  if (!name) return <span className="text-muted-foreground">-</span>
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar name={name} />
      <span className="truncate" dir="auto">
        {name}
      </span>
    </span>
  )
}

type VillaCellProps = {
  villaNumber: string
  // The villa's id: the number links to its page (or to `to`). Without it, the number is plain text.
  id?: string
  to?: string
  // A line under the number (the location, the owner).
  sub?: ReactNode
  // A finished villa shows its tile in green.
  done?: boolean
}

/** A villa in a list cell: a building tile, the villa number (a link to the villa) and a line under it. */
export function VillaCell({ villaNumber, id, to, sub, done }: VillaCellProps) {
  const href = to ?? (id ? `/villas/${id}` : undefined)
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
          done
            ? "bg-success-soft text-success"
            : "bg-accent/10 text-accent group-hover/row:bg-accent group-hover/row:text-accent-foreground",
        )}
      >
        <Building2 size={15} strokeWidth={1.9} />
      </span>
      <div className="min-w-0">
        {href ? (
          <Link
            to={href}
            className="font-semibold tabular-nums hover:text-accent hover:underline"
          >
            {villaNumber}
          </Link>
        ) : (
          <span className="font-semibold tabular-nums">{villaNumber}</span>
        )}
        {sub && (
          <p
            className="max-w-56 truncate text-xs text-muted-foreground"
            dir="auto"
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}

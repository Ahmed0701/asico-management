import { cn } from "@/shared/lib/cn"

export function AuthErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="mb-4 rounded-lg bg-danger-soft p-3 text-sm text-danger"
    >
      {children}
    </p>
  )
}

export function AuthSuccessBanner({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p
      role="status"
      className={cn(
        "mb-4 rounded-lg bg-closed-soft p-3 text-sm text-closed",
        className,
      )}
    >
      {children}
    </p>
  )
}

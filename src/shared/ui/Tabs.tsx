import { cn } from "../lib/cn"

export default function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: {
    id: T
    label: string
  }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div role="tablist" className="mb-5 flex gap-1 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          type="button"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition",
            value === tab.id
              ? "border-accent text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

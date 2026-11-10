import { clampProgressPercent } from "@/shared/lib/progressDisplay"
import { Progress } from "@/shared/ui/progress"

export default function ProgressCell({ value }: { value: number }) {
  const clamped = clampProgressPercent(value)
  return (
    <div className="flex min-w-28 items-center gap-2">
      <Progress value={clamped} className="h-2 flex-1" />
      <span className="w-10 shrink-0 text-end text-xs tabular-nums text-muted-foreground">
        {clamped}%
      </span>
    </div>
  )
}

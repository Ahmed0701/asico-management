"use client"

import * as React from "react"

import * as ProgressPrimitive from "@radix-ui/react-progress"

import {
  clampProgressPercent,
  progressIndicatorClass,
} from "@/shared/lib/progressDisplay"
import { cn } from "./utils"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const clamped = clampProgressPercent(value ?? 0)

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-progress-track",
        className,
      )}
      value={clamped}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full flex-1 motion-reduce:transition-none transition-all duration-300 ease-in-out",
          progressIndicatorClass(clamped),
        )}
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }

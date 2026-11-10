import * as React from "react"

import { cn } from "./utils"

import { fieldControlClassName } from "./field-styles"

const Textarea =
  React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
    ({ className, ...props }, ref) => {
      return (
        <textarea
          ref={ref}
          data-slot="textarea"
          className={cn(
            fieldControlClassName,

            "field-sizing-content flex min-h-16 w-full resize-none rounded-md px-3 py-2 text-base md:text-sm",

            className,
          )}
          {...props}
        />
      )
    },
  )

Textarea.displayName = "Textarea"

export { Textarea }

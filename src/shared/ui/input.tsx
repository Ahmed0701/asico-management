import * as React from "react"

import { cn } from "./utils"

import { fieldControlClassName } from "./field-styles"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          fieldControlClassName,

          "flex h-9 w-full min-w-0 rounded-md px-3 py-1 text-base md:text-sm",

          "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",

          "selection:bg-primary selection:text-primary-foreground",

          className,
        )}
        {...props}
      />
    )
  },
)

Input.displayName = "Input"

export { Input }

import * as React from "react"

import { useUiDirection } from "@/shared/lib/useUiDirection"

import { cn } from "./utils"

function Table({
  className,

  dir,

  noRtlMirror,

  ...props
}: React.ComponentProps<"table"> & { noRtlMirror?: boolean }) {
  // overflow-x-auto creates a Chromium block-formatting-context that resets the

  // scroll origin to the left edge regardless of inherited CSS direction. So we

  // forward `dir` to BOTH the scroll container and the <table> itself.

  // The default value comes from the AppContext — reactive, so every table in

  // the app follows RTL/LTR automatically. Callers can override with an explicit

  // `dir="ltr"` to pin one table, or pass `noRtlMirror` to keep DOM column order

  // (used by OCR review tables that must match raw extracted data).

  const direction = useUiDirection()

  const resolvedDir = noRtlMirror ? "ltr" : (dir ?? direction)

  return (
    <div
      data-slot="table-container"
      dir={resolvedDir}
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        dir={resolvedDir}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b [&_tr]:border-border", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t border-table-border font-medium [&>tr]:last:border-b-0",

        className,
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b border-table-border transition-colors",

        className,
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",

        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 text-start align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",

        className,
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,

  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}

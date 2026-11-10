import { cn } from "@/shared/lib/cn"

export default function TruncatedText({
  text,
  maxWidthClass = "max-w-[12rem]",
  className,
  dir = "ltr",
}: {
  text: string
  maxWidthClass?: string
  className?: string
  dir?: "ltr" | "rtl" | "auto"
}) {
  return (
    <span
      dir={dir}
      title={text}
      className={cn(
        "inline-block truncate align-bottom",
        maxWidthClass,
        className,
      )}
    >
      {text}
    </span>
  )
}

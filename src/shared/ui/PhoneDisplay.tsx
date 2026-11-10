import { cn } from "@/shared/lib/cn"
import { safeTelHref } from "@/shared/lib/phone/phoneLink"

export default function PhoneDisplay({
  phone,
  className,
}: {
  phone: string
  className?: string
}) {
  const href = safeTelHref(phone)
  const styles = cn(
    "inline-block max-w-full truncate text-start tabular-nums",
    className,
  )
  if (href) {
    return (
      <a dir="ltr" href={href} className={cn(styles, "hover:underline")}>
        {phone}
      </a>
    )
  }
  return (
    <span dir="ltr" className={styles}>
      {phone}
    </span>
  )
}

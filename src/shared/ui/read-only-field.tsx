import { Input } from "./input"
import { Label } from "./label"

export function ReadOnlyField({
  label,
  value,
  dir,
}: {
  label: string
  value: string
  dir?: "ltr" | "rtl" | "auto"
}) {
  return (
    <div className="grid gap-3">
      <Label className="text-xs font-normal text-muted-foreground">
        {label}
      </Label>
      <Input value={value} readOnly disabled dir={dir} />
    </div>
  )
}

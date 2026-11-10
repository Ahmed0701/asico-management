import { useVillaOptionsQuery } from "@/features/villas/api"
import { SearchFilterSelect } from "@/shared/ui/search-select"

/** A list filter by villa: type part of the villa number to find it. Empty means every villa. */
export default function VillaOptionSelect({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (villaId: string) => void
  label: string
  disabled?: boolean
}) {
  const { data } = useVillaOptionsQuery()
  return (
    <SearchFilterSelect
      label={label}
      value={value}
      onChange={onChange}
      options={(data ?? []).map((v) => ({
        value: v.id,
        label: v.villaNumber,
      }))}
    />
  )
}

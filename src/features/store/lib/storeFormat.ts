import i18n from "@/shared/i18n"

/** A stock quantity with at most two decimals, in western digits, e.g. "1,250.5". */
export function formatQuantity(value: number): string {
  return new Intl.NumberFormat(
    i18n.language === "ar" ? "ar-u-nu-latn" : "en-GB",
    {
      maximumFractionDigits: 2,
    },
  ).format(value)
}

/** A unit as the reader's language says it: "Pcs" is "قطعة" in Arabic. A unit outside the list is shown as it is. */
export function unitLabel(unit: string): string {
  return i18n.t(`store.units.${unit}`, { defaultValue: unit })
}

/** A movement's change with its sign, e.g. "+30" or "-12.25". */
export function formatChange(value: number): string {
  return `${
    value > 0 ? "+" : value < 0 ? "-" : ""
  }${formatQuantity(Math.abs(value))}`
}

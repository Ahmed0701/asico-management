import i18n from "../i18n"

/** Calendar dates stored at midnight UTC — render as UTC date only (not local). */
export function formatCalendarDateUtc(iso: string): string {
  const locale = i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB"
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    dateStyle: "medium",
  }).format(new Date(iso))
}

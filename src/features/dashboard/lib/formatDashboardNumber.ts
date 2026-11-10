import i18n from "@/shared/i18n"

export function dashboardNumberFormat(): Intl.NumberFormat {
  const locale = i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-US"
  return new Intl.NumberFormat(locale)
}

export function formatDashboardCount(value: number): string {
  return dashboardNumberFormat().format(value)
}

export function formatDashboardPercent(value: number): string {
  return `${dashboardNumberFormat().format(value)}%`
}

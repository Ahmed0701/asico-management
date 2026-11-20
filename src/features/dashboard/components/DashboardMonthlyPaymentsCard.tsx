import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import { useMonthlyProgressQuery } from "@/features/monthly-progress/api"
import { formatBudgetDisplay } from "@/features/villas/api/budget"
import { dashboardLinks } from "../lib/dashboardLinks"
import DashboardLinkCard from "./DashboardLinkCard"

/**
 * The Monthly Payments on the dashboard: what the contractors are owed now (each villa's progress since its last payment
 * times its Work Order Value), and how many contractors and villas. Opens the Monthly Payments page.
 */

export default function DashboardMonthlyPaymentsCard() {
  const { t, i18n } = useTranslation()
  const { can } = usePermissions()
  const allowed = can("villas:read")
  // One row is enough: the totals are over every villa owed money.
  const query = useMonthlyProgressQuery(
    { page: 1, limit: 1, owed: true },
    allowed,
  )
  const summary = query.data?.summary
  if (!allowed || !summary) return null

  const villas = summary.contractors.reduce(
    (sum, entry) => sum + entry.villaCount,
    0,
  )
  const contractors = summary.contractors.filter(
    (entry) => entry.contractor !== null,
  ).length

  return (
    <DashboardLinkCard
      to={dashboardLinks.monthlyPayments()}
      label={t("dashboard.monthlyPayments")}
      tone={summary.totalDueMinor > 0 ? "green" : "teal"}
      icon="file"
      value={formatBudgetDisplay(
        summary.totalDueMinor,
        "KWD",
        i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB",
      )}
      help={t("dashboard.monthlyPaymentsHelp", { contractors, villas })}
    />
  )
}

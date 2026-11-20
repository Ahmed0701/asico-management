import { useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"
import PageHeader from "@/shared/ui/PageHeader"
import Tabs from "@/shared/ui/Tabs"
import EmployeesPanel from "../components/EmployeesPanel"
import ExpensesPanel from "../components/ExpensesPanel"

type Tab = "employees" | "expenses"

/**
 * The Department Overhead: its employees and their monthly salaries, and the additional expenses (invoices and others)
 * entered for the villas. The open tab is kept in the address (`?tab=expenses`).
 */
export default function DepartmentOverheadPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB"
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: Tab =
    searchParams.get("tab") === "expenses" ? "expenses" : "employees"

  // A tab's search, filters, sort and page do not carry over to the other.
  const openTab = (next: Tab) =>
    setSearchParams(next === "expenses" ? { tab: "expenses" } : {})

  return (
    <>
      <PageHeader
        title={t("overhead.title")}
        subtitle={t("overhead.subtitle")}
      />
      <Tabs
        value={tab}
        onChange={openTab}
        tabs={[
          { id: "employees", label: t("overhead.tabs.employees") },
          { id: "expenses", label: t("overhead.tabs.expenses") },
        ]}
      />
      {tab === "employees" ? (
        <EmployeesPanel locale={locale} />
      ) : (
        <ExpensesPanel locale={locale} />
      )}
    </>
  )
}

import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import PageHeader from "../ui/PageHeader"

export default function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t("notFound.title")} subtitle={t("notFound.body")} />
      <Link to="/" className="text-sm font-medium text-accent underline">
        {t("nav.dashboard")}
      </Link>
    </>
  )
}

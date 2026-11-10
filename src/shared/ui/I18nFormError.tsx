import { useTranslation } from "react-i18next"

const I18N_FORM_ERROR =
  /^(dailyReports\.|smallWorks\.|openWorks\.|siteReports\.|dailyLabour\.|validation\.)/

export default function I18nFormError({
  message,
  className = "text-red-500 text-[10px]",
}: {
  message?: string
  className?: string
}) {
  const { t } = useTranslation()
  if (!message) return null
  const text = I18N_FORM_ERROR.test(message) ? t(message) : message
  return <p className={className}>{text}</p>
}

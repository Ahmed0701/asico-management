import { useTranslation } from "react-i18next"

export default function DirectoryEmailDisplay({
  value,
}: {
  value?: string | null
}) {
  const { t } = useTranslation()
  const text = value?.trim()
  if (!text) {
    return <span className="text-muted-foreground">{t("common.none")}</span>
  }
  return (
    <a href={`mailto:${text}`} dir="ltr" className="hover:underline">
      {text}
    </a>
  )
}

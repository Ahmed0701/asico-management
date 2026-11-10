import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import Button from "@/shared/ui/Button"

// Opens the Done Works page: the open works and small works that are finished
// (they leave the open works and small works lists once they are done).
export default function DoneWorksButton() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <Button
      type="button"
      size="sm"
      icon="check"
      onClick={() => navigate("/done-works")}
    >
      {t("doneWorks.button")}
    </Button>
  )
}

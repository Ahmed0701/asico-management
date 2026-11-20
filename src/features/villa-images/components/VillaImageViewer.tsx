import { useTranslation } from "react-i18next"
import { formatDateTime } from "@/shared/lib/format"
import Button, { IconButton } from "@/shared/ui/Button"
import Modal from "@/shared/ui/Modal"
import { Skeleton } from "@/shared/ui/skeleton"
import { useVillaImageUrl, type VillaImage } from "../api"

type Props = {
  image: VillaImage
  /** The previous and next images of the villa, to step through them. */
  onPrevious?: () => void
  onNext?: () => void
  canDelete: boolean
  onDelete: (image: VillaImage) => void
  onClose: () => void
}

/** One site image full size, with who added it and when, and the way to the previous and next ones. */
export default function VillaImageViewer({
  image,
  onPrevious,
  onNext,
  canDelete,
  onDelete,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const url = useVillaImageUrl(image.id)

  return (
    <Modal
      open
      onClose={onClose}
      title={image.name}
      footer={
        <>
          {canDelete && (
            <Button
              type="button"
              variant="danger"
              icon="trash"
              onClick={() => onDelete(image)}
            >
              {t("villaImages.delete")}
            </Button>
          )}
          <Button type="button" onClick={onClose}>
            {t("common.close")}
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <div className="relative grid min-h-64 place-items-center overflow-hidden rounded-xl bg-muted/40">
          {url.isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : url.data ? (
            <img
              src={url.data}
              alt={image.name}
              className="max-h-[70vh] w-auto object-contain"
            />
          ) : (
            <p className="p-6 text-sm text-muted-foreground">
              {t("villaImages.loadFailed")}
            </p>
          )}
          {onPrevious && (
            <span className="absolute inset-s-2 top-1/2 -translate-y-1/2">
              <IconButton
                icon="chevronLeft"
                label={t("villaImages.previous")}
                onClick={onPrevious}
              />
            </span>
          )}
          {onNext && (
            <span className="absolute inset-e-2 top-1/2 -translate-y-1/2">
              <IconButton
                icon="chevronRight"
                label={t("villaImages.next")}
                onClick={onNext}
              />
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {t("villaImages.addedBy", {
            name: image.uploadedBy?.name ?? t("villaImages.unknownUser"),
            at: formatDateTime(image.uploadedAt),
          })}
        </p>
      </div>
    </Modal>
  )
}

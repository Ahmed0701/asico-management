import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Images } from "lucide-react"
import { usePermissions } from "@/features/auth/api"
import { toApiError } from "@/shared/api/errors"
import { toast } from "@/shared/lib/toast"
import { Badge } from "@/shared/ui/Badge"
import Button from "@/shared/ui/Button"
import CollapsibleCard from "@/shared/ui/CollapsibleCard"
import { ConfirmModal } from "@/shared/ui/Modal"
import {
  IMAGE_ACCEPT,
  MAX_IMAGES_PER_UPLOAD,
  MAX_IMAGES_PER_VILLA,
  useDeleteVillaImageMutation,
  useUploadVillaImagesMutation,
  useVillaImagesQuery,
  type VillaImage,
} from "../api"
import VillaImageThumb from "./VillaImageThumb"
import VillaImageViewer from "./VillaImageViewer"

type Props = {
  villaId: string
}

/**
 * The Site Images of a villa: photos of the site in a grid, the newest first. Someone who may upload villa documents adds
 * photos (JPEG or PNG, several at once); a click opens one full size. Loaded the first time it is opened.
 */
export default function VillaSiteImagesCard({ villaId }: Props) {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const canUpload = can("villa-documents:upload")
  const canDelete = can("villa-documents:delete")
  const [open, setOpen] = useState(false)
  const query = useVillaImagesQuery(villaId, open)
  const upload = useUploadVillaImagesMutation()
  const remove = useDeleteVillaImageMutation()
  const input = useRef<HTMLInputElement>(null)
  // The id, so the viewer follows the list (an image deleted closes it).
  const [viewing, setViewing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<VillaImage | null>(null)

  const images = query.data ?? []
  const index = images.findIndex((image) => image.id === viewing)
  const current = index >= 0 ? images[index] : undefined
  const room = MAX_IMAGES_PER_VILLA - images.length

  const pick = () => {
    setOpen(true)
    input.current?.click()
  }

  const onFiles = async (list: FileList | null) => {
    const files = Array.from(list ?? [])
    if (input.current) input.current.value = ""
    if (files.length === 0) return
    if (files.length > MAX_IMAGES_PER_UPLOAD) {
      toast.error(
        t("villaImages.tooManyAtOnce", { count: MAX_IMAGES_PER_UPLOAD }),
      )
      return
    }
    try {
      await upload.mutateAsync({ villaId, files })
      toast.success(t("villaImages.uploaded", { count: files.length }))
    } catch (err) {
      toast.error(toApiError(err).message)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync({ id: deleting.id, villaId })
      toast.success(t("villaImages.deleted"))
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <CollapsibleCard
      title={t("villaImages.title")}
      icon={Images}
      open={open}
      onOpenChange={setOpen}
      badges={
        query.data && (
          <Badge tone="neutral">
            {t("villaImages.count", { count: images.length })}
          </Badge>
        )
      }
    >
      <input
        ref={input}
        type="file"
        multiple
        accept={IMAGE_ACCEPT}
        className="hidden"
        data-testid="villa-images-input"
        onChange={(e) => void onFiles(e.target.files)}
      />
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {t("villaImages.hint", {
              perUpload: MAX_IMAGES_PER_UPLOAD,
              perVilla: MAX_IMAGES_PER_VILLA,
            })}
          </p>
          {canUpload && (
            <Button
              type="button"
              size="sm"
              variant="primary"
              icon="upload"
              disabled={upload.isPending || room <= 0}
              onClick={pick}
            >
              {upload.isPending
                ? t("villaImages.uploading")
                : t("villaImages.add")}
            </Button>
          )}
        </div>

        {query.isError ? (
          <p role="alert" className="text-sm text-danger">
            {toApiError(query.error).message}
          </p>
        ) : query.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : images.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
            {t("villaImages.empty")}
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {images.map((image) => (
              <li key={image.id}>
                <VillaImageThumb
                  image={image}
                  onOpen={(picked) => setViewing(picked.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {current && (
        <VillaImageViewer
          image={current}
          onPrevious={
            index > 0 ? () => setViewing(images[index - 1]!.id) : undefined
          }
          onNext={
            index < images.length - 1
              ? () => setViewing(images[index + 1]!.id)
              : undefined
          }
          canDelete={canDelete}
          onDelete={setDeleting}
          onClose={() => setViewing(null)}
        />
      )}
      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={t("villaImages.deleteTitle")}
        message={t("villaImages.deleteBody", { name: deleting?.name ?? "" })}
        confirmPending={remove.isPending}
      />
    </CollapsibleCard>
  )
}

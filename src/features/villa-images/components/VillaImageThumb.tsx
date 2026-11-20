import { useTranslation } from "react-i18next"
import { ImageOff } from "lucide-react"
import { Skeleton } from "@/shared/ui/skeleton"
import { useVillaImageUrl, type VillaImage } from "../api"

type Props = {
  image: VillaImage
  onOpen: (image: VillaImage) => void
}

/** One site image as a square tile; a click opens it full size. */
export default function VillaImageThumb({ image, onOpen }: Props) {
  const { t } = useTranslation()
  const url = useVillaImageUrl(image.id)

  return (
    <button
      type="button"
      onClick={() => onOpen(image)}
      className="group/thumb relative aspect-square overflow-hidden rounded-xl border border-border bg-muted/40 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
      aria-label={t("villaImages.open", { name: image.name })}
    >
      {url.isLoading ? (
        <Skeleton className="size-full" />
      ) : url.data ? (
        <img
          src={url.data}
          alt={image.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
        />
      ) : (
        <span className="grid size-full place-items-center text-muted-foreground">
          <ImageOff size={20} aria-hidden />
        </span>
      )}
    </button>
  )
}

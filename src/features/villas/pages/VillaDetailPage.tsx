import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import { toApiError } from "@/shared/api/errors"
import { ConfirmModal } from "@/shared/ui/Modal"
import { Card } from "@/shared/ui/PageHeader"
import { VillaDetailSkeleton } from "@/shared/ui/loading-skeletons"
import { useDeleteVillaMutation, useVillaQuery } from "../api"
import VillaDetailHeroCard from "../components/VillaDetailHeroCard"
import VillaDetailPhasesCard from "../components/VillaDetailPhasesCard"
import VillaDetailRegistryCard from "../components/VillaDetailRegistryCard"
import VillaDetailMewCard from "../components/VillaDetailMewCard"
import VillaMaterialsCard from "@/features/materials/components/VillaMaterialsCard"
import VillaDetailTabbedPanel from "../components/VillaDetailTabbedPanel"
import VillaFormModal from "../components/VillaFormModal"

export default function VillaDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { can } = usePermissions()
  const { id } = useParams<{ id: string }>()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { data: villa, isLoading, isError, error, refetch } = useVillaQuery(id)
  const remove = useDeleteVillaMutation()

  const canUpdate = can("villas:update")
  const canDelete = can("villas:delete")
  const canMaterials = can("materials:read")

  if (isLoading && !villa) {
    return <VillaDetailSkeleton />
  }

  if (isError || !villa) {
    const parsed = isError ? toApiError(error) : null
    if (parsed?.status === 403) {
      return (
        <Card className="p-8 text-center">
          <p className="font-medium">{parsed.message}</p>
        </Card>
      )
    }
    return (
      <Card className="p-8 text-center">
        <p className="font-medium">{t("villas.notFound")}</p>
        <Link
          to="/villas"
          className="mt-3 inline-block text-sm text-accent hover:underline"
        >
          {t("villas.backToList")}
        </Link>
      </Card>
    )
  }

  const handleDelete = async () => {
    try {
      await remove.mutateAsync({
        id: villa.id,
        write: { ifMatch: villa.version },
      })
      setDeleteOpen(false)
      navigate("/villas")
    } catch (err) {
      const parsed = toApiError(err)
      if (parsed.code === "VILLA_NOT_FOUND" || parsed.status === 404) {
        setDeleteOpen(false)
        navigate("/villas")
      }
    }
  }

  return (
    <>
      <Link
        to="/villas"
        className="mb-4 inline-block text-sm text-accent hover:underline"
      >
        {t("villas.backToList")}
      </Link>
      <VillaDetailHeroCard
        villa={villa}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />
      <VillaDetailPhasesCard phases={villa.phases} />
      <VillaDetailRegistryCard villa={villa} />
      <VillaDetailMewCard villa={villa} />
      {canMaterials && <VillaMaterialsCard villaId={villa.id} />}
      <VillaDetailTabbedPanel villa={villa} />
      <VillaFormModal
        open={editOpen}
        villaId={villa.id}
        onClose={() => setEditOpen(false)}
        onSaved={() => void refetch()}
        onDeletedWhileEditing={() => {
          setEditOpen(false)
          navigate("/villas")
        }}
      />
      <ConfirmModal
        open={deleteOpen}
        title={t("villas.deleteTitle")}
        message={t("villas.deleteBody", { name: villa.villaNumber })}
        confirmLabel={t("common.delete")}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteOpen(false)}
        confirmPending={remove.isPending}
      />
    </>
  )
}

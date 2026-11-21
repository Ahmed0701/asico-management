import type { ReactNode } from "react"
import { ArrowLeft } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import { toApiError } from "@/shared/api/errors"
import { toast } from "@/shared/lib/toast"
import { ConfirmModal } from "@/shared/ui/Modal"
import { Card } from "@/shared/ui/PageHeader"
import { VillaDetailSkeleton } from "@/shared/ui/loading-skeletons"
import {
  useDeleteVillaMutation,
  useVillaMewFollowUpMutation,
  useVillaQuery,
} from "../api"
import VillaDetailHeroCard from "../components/VillaDetailHeroCard"
import VillaDetailPhasesCard from "../components/VillaDetailPhasesCard"
import VillaDetailMewCard from "../components/VillaDetailMewCard"
import VillaBudgetCard from "../components/VillaBudgetCard"
import VariationOrdersCard from "@/features/variation-orders/components/VariationOrdersCard"
import VillaMaterialsProgressCard from "@/features/materials/components/VillaMaterialsProgressCard"
import VillaPaymentHistoryCard from "@/features/monthly-progress/components/VillaPaymentHistoryCard"
import VillaSiteImagesCard from "@/features/villa-images/components/VillaSiteImagesCard"
import VillaVendorsCard from "@/features/materials/components/VillaVendorsCard"
import VillaDetailTabbedPanel from "../components/VillaDetailTabbedPanel"
import VillaFormModal from "../components/VillaFormModal"

// A small title between the groups of the villa page, with a line that fades out.
function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 mt-6 flex items-center gap-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {children}
      </h2>
      <span
        aria-hidden
        className="h-px flex-1 bg-gradient-to-r from-border to-transparent rtl:bg-gradient-to-l"
      />
    </div>
  )
}

export default function VillaDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { can, engineerScope } = usePermissions()
  const { id } = useParams<{ id: string }>()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { data: villa, isLoading, isError, error, refetch } = useVillaQuery(id)
  const remove = useDeleteVillaMutation()
  const mewFollowUp = useVillaMewFollowUpMutation()

  const canUpdate = can("villas:update")
  // A user linked to an electrical engineer adds variation orders but never sees the budget.
  const canBudget = !engineerScope
  const canDelete = can("villas:delete")
  const canMaterials = can("materials:read")
  const canSiteImages = can("villa-documents:download")
  // A user linked to an electrical engineer never sees the payments.
  const canPayments = can("payments:read") && !engineerScope
  // The same permission the MEW follow-up page uses to add and remove villas.
  const canMewFollowUp = can("villas:inspection")

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

  // Puts the villa on the MEW follow-up list, or takes it off.
  const toggleMewFollowUp = async () => {
    const marked = !villa.mewFollowUp
    try {
      await mewFollowUp.mutateAsync({
        id: villa.id,
        marked,
        write: { ifMatch: villa.version },
      })
      toast.success(
        t(marked ? "mewFollowUp.added" : "mewFollowUp.removed", {
          name: villa.villaNumber,
        }),
      )
    } catch (err) {
      // Someone else changed the villa first: say so and show it as it is now.
      toast.error(toApiError(err).message)
      void refetch()
    }
  }

  return (
    <>
      <Link
        to="/villas"
        className="group mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
      >
        <ArrowLeft
          size={15}
          aria-hidden
          className="transition-transform group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5"
        />
        {t("villas.backToList")}
      </Link>
      <VillaDetailHeroCard
        villa={villa}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
        canMewFollowUp={canMewFollowUp}
        mewFollowUpPending={mewFollowUp.isPending}
        onToggleMewFollowUp={() => void toggleMewFollowUp()}
      />
      <VillaDetailPhasesCard phases={villa.phases} />
      <SectionHeading>{t("villas.sections.records")}</SectionHeading>
      {canBudget && <VillaBudgetCard villaId={villa.id} canEdit={canUpdate} />}
      {canPayments && (
        <VillaPaymentHistoryCard
          villaId={villa.id}
          villaNumber={villa.villaNumber}
        />
      )}
      <VillaDetailMewCard villa={villa} />
      <VariationOrdersCard villaId={villa.id} canEdit={canUpdate} />
      {canMaterials && (
        <VillaVendorsCard villaId={villa.id} villaNumber={villa.villaNumber} />
      )}
      {canMaterials && (
        <VillaMaterialsProgressCard
          villaId={villa.id}
          villaNumber={villa.villaNumber}
        />
      )}
      {canSiteImages && <VillaSiteImagesCard villaId={villa.id} />}
      <SectionHeading>{t("villas.sections.activity")}</SectionHeading>
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

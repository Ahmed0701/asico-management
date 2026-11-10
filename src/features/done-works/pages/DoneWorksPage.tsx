import { useState } from "react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import {
  useOpenWorksListQuery,
  type OpenWorkSortField,
} from "@/features/open-works/api"
import OpenWorkFormModal from "@/features/open-works/components/OpenWorkFormModal"
import OpenWorksListFooter from "@/features/open-works/components/OpenWorksListFooter"
import OpenWorksTable from "@/features/open-works/components/OpenWorksTable"
import {
  useSmallWorksListQuery,
  type SmallWorkSortField,
} from "@/features/small-works/api"
import SmallWorkFormModal from "@/features/small-works/components/SmallWorkFormModal"
import SmallWorksListFooter from "@/features/small-works/components/SmallWorksListFooter"
import SmallWorksTable from "@/features/small-works/components/SmallWorksTable"
import { SearchInput } from "@/shared/ui/Field"
import PageHeader, { Card } from "@/shared/ui/PageHeader"

const PAGE_SIZE = 20

// "field" -> "field:asc" -> "field:desc" -> no sort, like the list pages.
function nextSort(current: string, field: string): string {
  if (current === `${field}:asc`) return `${field}:desc`
  if (current === `${field}:desc`) return ""
  return `${field}:asc`
}

// The works that are finished: open works at 100% (done) and small works marked done.
// They leave the open works and small works lists, and are listed here instead.
export default function DoneWorksPage() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const [search, setSearch] = useState("")
  const searchText = search.trim() || undefined

  const canOpenWorks = can("open-works:read")
  const canSmallWorks = can("small-works:read")

  return (
    <>
      <PageHeader
        title={t("doneWorks.title")}
        subtitle={t("doneWorks.subtitle")}
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t("doneWorks.searchPlaceholder")}
          />
        </div>
        {canOpenWorks && (
          <Link
            to="/villas/open-works"
            className="text-sm text-accent hover:underline"
          >
            {t("doneWorks.backToOpenWorks")}
          </Link>
        )}
        {canSmallWorks && (
          <Link
            to="/small-works"
            className="text-sm text-accent hover:underline"
          >
            {t("doneWorks.backToSmallWorks")}
          </Link>
        )}
      </div>
      {canOpenWorks && <DoneOpenWorks search={searchText} />}
      {canSmallWorks && <DoneSmallWorks search={searchText} />}
      {!canOpenWorks && !canSmallWorks && (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {t("doneWorks.noAccess")}
        </Card>
      )}
    </>
  )
}

function DoneOpenWorks({ search }: { search: string | undefined }) {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [sort, setSort] = useState("")
  const [editId, setEditId] = useState<string | undefined>()

  const { data, isLoading } = useOpenWorksListQuery({
    page,
    limit,
    sort: sort || undefined,
    search,
    done: true,
  })
  const meta = data?.meta

  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-semibold">
        {t("doneWorks.openWorksTitle")}
        {meta ? ` (${meta.total})` : ""}
      </h2>
      <OpenWorksTable
        rows={data?.data ?? []}
        isLoading={isLoading}
        sort={sort}
        onToggleSort={(field: OpenWorkSortField) => {
          setSort(nextSort(sort, field))
          setPage(1)
        }}
        showVillaColumn
        canUpdate={can("open-works:update")}
        canDelete={false}
        onEdit={(row) => setEditId(row.id)}
        onDelete={() => {}}
        emptyMessage={t("doneWorks.openWorksEmpty")}
      />
      {meta && meta.total > 0 && (
        <OpenWorksListFooter
          meta={meta}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setLimit(size)
            setPage(1)
          }}
          onGoLastPage={() => setPage(meta.totalPages)}
        />
      )}
      {/* Editing a done work below 100% sends it back to the open works. */}
      <OpenWorkFormModal
        open={editId !== undefined}
        workId={editId}
        onClose={() => setEditId(undefined)}
        onSaved={() => setEditId(undefined)}
      />
    </section>
  )
}

function DoneSmallWorks({ search }: { search: string | undefined }) {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [sort, setSort] = useState("")
  const [editId, setEditId] = useState<string | undefined>()

  const { data, isLoading } = useSmallWorksListQuery({
    page,
    limit,
    sort: sort || undefined,
    search,
    status: "DONE",
  })
  const meta = data?.meta

  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-semibold">
        {t("doneWorks.smallWorksTitle")}
        {meta ? ` (${meta.total})` : ""}
      </h2>
      <SmallWorksTable
        rows={data?.data ?? []}
        isLoading={isLoading}
        sort={sort}
        onToggleSort={(field: SmallWorkSortField) => {
          setSort(nextSort(sort, field))
          setPage(1)
        }}
        showVillaColumn
        canUpdate={can("small-works:update")}
        canDelete={false}
        onEdit={(row) => setEditId(row.id)}
        onDelete={() => {}}
        emptyMessage={t("doneWorks.smallWorksEmpty")}
      />
      {meta && meta.total > 0 && (
        <SmallWorksListFooter
          meta={meta}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setLimit(size)
            setPage(1)
          }}
          onGoLastPage={() => setPage(meta.totalPages)}
        />
      )}
      {/* Setting a done small work back to pending sends it back to the small works. */}
      <SmallWorkFormModal
        open={editId !== undefined}
        workId={editId}
        onClose={() => setEditId(undefined)}
        onSaved={() => setEditId(undefined)}
      />
    </section>
  )
}

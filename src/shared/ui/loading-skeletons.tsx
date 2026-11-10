import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Table, TableBody, TableCell, TableRow } from "@/shared/ui/table"
import { Card } from "@/shared/ui/PageHeader"
import { Skeleton } from "@/shared/ui/skeleton"
import { cn } from "@/shared/ui/utils"

function SrOnlyLoading() {
  const { t } = useTranslation()
  return <span className="sr-only">{t("common.loading")}</span>
}

function SkeletonBlock({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className} aria-busy="true">
      <SrOnlyLoading />
      {children}
    </div>
  )
}

export function TableBodySkeleton({
  columns,
  rows = 6,
  cellClassName = "px-3 py-3",
}: {
  columns: number
  rows?: number
  cellClassName?: string
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: columns }).map((__, j) => (
            <TableCell key={j} className={cellClassName}>
              <Skeleton
                className="h-4"
                style={{ width: `${55 + ((i * 7 + j * 13) % 40)}%` }}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

export function TableSkeleton({
  columns,
  rows = 8,
  className,
}: {
  columns: number
  rows?: number
  className?: string
}) {
  return (
    <SkeletonBlock
      className={cn(
        "overflow-hidden rounded-lg border border-border",
        className,
      )}
    >
      <Table>
        <TableBody>
          <TableBodySkeleton
            columns={columns}
            rows={rows}
            cellClassName="px-4 py-3"
          />
        </TableBody>
      </Table>
    </SkeletonBlock>
  )
}

export function CardSkeleton({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <Card className={cn("space-y-3 p-4", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: i === 0 ? "40%" : i === lines - 1 ? "55%" : "70%" }}
        />
      ))}
    </Card>
  )
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-8 w-16" />
          <Skeleton className="mt-3 h-1.5 w-full" />
        </Card>
      ))}
    </div>
  )
}

export function PageHeaderSkeleton({
  actionCount = 2,
  subtitle = false,
}: {
  actionCount?: number
  subtitle?: boolean
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 max-w-full" />
        {subtitle && <Skeleton className="h-4 w-56 max-w-full" />}
      </div>
      {actionCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: actionCount }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>
      )}
    </div>
  )
}

export function BackLinkSkeleton() {
  return <Skeleton className="mb-4 h-4 w-32" />
}

export function TabsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="mb-4 flex gap-2 border-b border-border pb-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-28" />
      ))}
    </div>
  )
}

export function DefinitionListSkeleton({
  fields = 4,
  cols = 2,
}: {
  fields?: number
  cols?: 1 | 2
}) {
  return (
    <dl className={cn("grid gap-3 text-sm", cols === 2 && "sm:grid-cols-2")}>
      {Array.from({ length: fields }).map((_, i) => (
        <div
          key={i}
          className={
            i === fields - 1 && fields % 2 === 1 ? "sm:col-span-2" : undefined
          }
        >
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-4 w-full max-w-xs" />
        </div>
      ))}
    </dl>
  )
}

export function FormFieldsSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <div className="space-y-4" aria-busy="true">
      <SrOnlyLoading />
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}

/** Back link + header + optional tabs + definition card (users, contractors, engineers). */
export function EntityDetailSkeleton({
  tabs = false,
  actionCount = 2,
  fields = 4,
}: {
  tabs?: boolean
  actionCount?: number
  fields?: number
}) {
  return (
    <SkeletonBlock>
      <BackLinkSkeleton />
      <PageHeaderSkeleton actionCount={actionCount} subtitle />
      {tabs && <TabsSkeleton />}
      <Card className="p-4">
        <DefinitionListSkeleton fields={fields} />
        <Skeleton className="mt-4 h-4 w-36" />
      </Card>
    </SkeletonBlock>
  )
}

export function VillaDetailSkeleton() {
  return (
    <SkeletonBlock>
      <PageHeaderSkeleton actionCount={3} />
      <Card className="space-y-4 p-4">
        <Skeleton className="h-4 w-40" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-4 w-52" />
        <Skeleton className="h-4 w-28" />
      </Card>
      <div className="mt-6 space-y-3">
        <Skeleton className="h-6 w-44" />
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="space-y-2 p-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-16 w-full" />
          </Card>
        ))}
      </div>
    </SkeletonBlock>
  )
}

export function AuditDetailSkeleton() {
  return (
    <SkeletonBlock>
      <BackLinkSkeleton />
      <PageHeaderSkeleton actionCount={0} subtitle />
      <Card className="mb-6 p-4">
        <DefinitionListSkeleton fields={6} cols={2} />
      </Card>
      <Card className="p-4">
        <Skeleton className="mb-3 h-5 w-32" />
        <Skeleton className="h-24 w-full" />
      </Card>
    </SkeletonBlock>
  )
}

export function DashboardSkeleton() {
  return (
    <SkeletonBlock>
      <PageHeaderSkeleton actionCount={0} subtitle />
      <StatGridSkeleton count={4} />
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-2">
          <Skeleton className="h-5 w-36" />
          <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
            <Skeleton className="size-45 shrink-0 rounded-full" />
            <div className="w-full space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </div>
        </Card>
        <Card className="lg:col-span-3">
          <Skeleton className="h-12 w-full rounded-none border-b border-border" />
          <ul className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-3 w-20 shrink-0" />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </SkeletonBlock>
  )
}

export function ContractorSummarySkeleton() {
  return (
    <SkeletonBlock>
      <div className="mb-4 flex gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="ms-auto h-9 w-24" />
      </div>
      <PageHeaderSkeleton actionCount={0} />
      <Skeleton className="-mt-2 mb-4 h-4 w-40" />
      <Skeleton className="mb-4 h-3 w-full max-w-md" />
      <StatGridSkeleton count={4} />
      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        <Table>
          <TableBody>
            <TableBodySkeleton columns={8} rows={6} cellClassName="px-4 py-3" />
          </TableBody>
        </Table>
      </div>
    </SkeletonBlock>
  )
}

export function AppBootstrapSkeleton() {
  return (
    <div className="flex min-h-screen bg-background" aria-busy="true">
      <SrOnlyLoading />
      <aside className="hidden w-56 shrink-0 border-e border-border bg-card p-4 lg:block">
        <Skeleton className="mb-6 h-8 w-28" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Skeleton className="h-14 w-full shrink-0 rounded-none border-b border-border" />
        <main className="mx-auto w-full max-w-350 flex-1 space-y-6 px-4 py-6 lg:px-8">
          <PageHeaderSkeleton actionCount={0} subtitle />
          <StatGridSkeleton count={4} />
        </main>
      </div>
    </div>
  )
}

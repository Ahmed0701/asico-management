import { useQueries } from "@tanstack/react-query"
import { usePermissions } from "@/features/auth/api"
import type { PermissionCode } from "@/features/auth/api/permissions"
import { api } from "@/shared/api/client"
import type { PaginatedMeta } from "@/shared/api/types"
import { SIDEBAR_COUNT_KEY } from "./sidebarCountKey"

/**
 * The counts shown next to some sidebar entries, each with the same filters as its page, so the number is what the page lists:
 * open works not done, small works still pending, every area, villas on MEW follow up, villas on MEW inspection that have not
 * passed, maintenance villas still open, owner notes and foreman missions still open, store items low on stock, payments overdue.
 */
const COUNTS = [
  {
    key: "villaOpenWorks",
    permission: "open-works:read",
    path: "/open-works",
    params: { done: "false" },
  },
  {
    key: "mewFollowUp",
    permission: "villas:read",
    path: "/villas",
    // A villa that passed the MEW inspection has left the follow-up list.
    params: { mewFollowUp: "true", mewInspectionPassed: "false" },
  },
  {
    key: "mewInspection",
    permission: "villas:read",
    path: "/villas",
    params: { mewInspection: "true", mewInspectionPassed: "false" },
  },
  {
    key: "smallWorks",
    permission: "small-works:read",
    path: "/small-works",
    params: { status: "PENDING" },
  },
  {
    key: "areas",
    permission: "areas:read",
    path: "/areas",
    params: {},
  },
  {
    key: "maintenance",
    permission: "maintenance:read",
    path: "/maintenance",
    params: { solved: "false" },
  },
  {
    key: "ownerNotes",
    permission: "owner-notes:read",
    path: "/owner-notes",
    params: { done: "false" },
  },
  {
    key: "foremanMissions",
    permission: "foreman-missions:read",
    path: "/foreman-missions",
    params: { done: "false" },
  },
  {
    key: "store",
    permission: "store:read",
    path: "/store/items",
    // Active items at or below their minimum.
    params: { low: "true" },
  },
  {
    key: "payments",
    permission: "payments:read",
    path: "/payments",
    params: { overdue: "true" },
  },
] as const satisfies readonly {
  key: string
  permission: PermissionCode
  path: string
  params: Record<string, string>
}[]

const KEY = SIDEBAR_COUNT_KEY

async function countOf(
  path: string,
  params: Record<string, string>,
): Promise<number> {
  // One row is enough: the total is in the page's meta.
  const res = await api.get<{ meta: PaginatedMeta }>(path, {
    params: { ...params, page: 1, limit: 1 },
  })
  return res.data.meta.total
}

/** The count of each counted sidebar entry the user may open (missing while it loads, or when they may not). */
export function useSidebarCounts(): Record<string, number | undefined> {
  const { can } = usePermissions()

  // Refreshed after every change made in the app by the query client itself (shared/api/queryClient.ts), as soon as
  // the server confirms it.
  const results = useQueries({
    queries: COUNTS.map((c) => ({
      queryKey: [...KEY, c.key],
      queryFn: () => countOf(c.path, c.params),
      enabled: can(c.permission),
      staleTime: 30_000,
      refetchInterval: 60_000,
      retry: false,
    })),
  })

  return Object.fromEntries(
    COUNTS.map((c, i) => [
      c.key,
      can(c.permission) ? results[i]?.data : undefined,
    ]),
  )
}

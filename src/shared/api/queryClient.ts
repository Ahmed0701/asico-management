import { MutationCache, QueryClient } from "@tanstack/react-query"
import { SIDEBAR_COUNT_KEY } from "@/shared/layout/sidebarCountKey"

// The notifications (their list and unread count: notificationsKeys.all). A change can finish what one is about (a work
// done, a note marked done, a payment paid), and the server then leaves it out, so they refresh with the counts.
export const NOTIFICATIONS_KEY = ["notifications"] as const

export function createAppQueryClient(): QueryClient {
  const client: QueryClient = new QueryClient({
    // Any change made in the app (a work done, a villa sent to MEW inspection, a maintenance solved...) refreshes the
    // sidebar counts the moment the server confirms it: this runs before the change's own page refresh, and is not
    // waited for, so the counts and the page update together instead of one after the other.
    mutationCache: new MutationCache({
      onSuccess: () => {
        void client.invalidateQueries({ queryKey: SIDEBAR_COUNT_KEY })
        void client.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  })
  return client
}

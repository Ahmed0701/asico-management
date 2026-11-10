import type { QueryClient } from "@tanstack/react-query"
import { villasKeys } from "@/features/villas/api/villas.queries"

export function invalidateAreasAfterWrite(qc: QueryClient): void {
  void qc.invalidateQueries({ queryKey: ["areas"] })
  void qc.invalidateQueries({ queryKey: villasKeys.areaOptions() })
}

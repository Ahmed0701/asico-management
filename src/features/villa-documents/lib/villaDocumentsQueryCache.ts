import type { QueryClient } from "@tanstack/react-query"
import { auditKeys } from "@/features/audit/api/audit.queries"
import { villasKeys } from "@/features/villas/api/villas.queries"
import { villaDocumentsKeys } from "../api/villa-documents.queries"

export function invalidateVillaDocumentsAfterWrite(
  qc: QueryClient,
  villaId: string,
): void {
  void qc.invalidateQueries({ queryKey: villaDocumentsKeys.list(villaId) })
  void qc.invalidateQueries({ queryKey: villasKeys.detail(villaId) })
  void qc.invalidateQueries({ queryKey: auditKeys.all })
}

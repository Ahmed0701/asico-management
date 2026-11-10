export type WriteRequest = {
  idempotencyKey?: string
  ifMatch?: number
}

export type VersionedEntity = {
  id: string
  version: number
}

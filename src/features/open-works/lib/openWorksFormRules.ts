import type { WorkStatusValue } from "../api/open-works.types"

const MAX_PROGRESS = 100

export function statusAgreesWithProgress(
  status: WorkStatusValue,
  progress: number,
): boolean {
  if (status === "DONE") return progress === MAX_PROGRESS
  if (status === "NOT_STARTED") return progress === 0
  return progress < MAX_PROGRESS
}

export function inferStatusFromProgress(progress: number): WorkStatusValue {
  if (progress === 0) return "NOT_STARTED"
  if (progress === MAX_PROGRESS) return "DONE"
  return "IN_PROGRESS"
}

export type StatusProgressPair = {
  status: WorkStatusValue
  progress: number
}

export function resolveStatusAndProgress(input: {
  status?: WorkStatusValue
  progress?: number
}): StatusProgressPair {
  if (input.status !== undefined && input.progress !== undefined) {
    return { status: input.status, progress: input.progress }
  }
  if (input.progress !== undefined) {
    return {
      progress: input.progress,
      status: inferStatusFromProgress(input.progress),
    }
  }
  const status = input.status ?? "NOT_STARTED"
  return {
    status,
    progress: status === "DONE" ? MAX_PROGRESS : 0,
  }
}

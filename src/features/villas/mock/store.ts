import { useSyncExternalStore } from "react"
import { defaultVillaPhases, initialVillas } from "./seed"
import type { VillaRecord } from "./types"

let villas: VillaRecord[] = initialVillas.map((v) => ({
  ...v,
  phases: [...v.phases],
}))
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return villas
}

export function useVillasMockStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function getVillaById(id: string): VillaRecord | undefined {
  return villas.find((v) => v.villaNumber === id)
}

/** @deprecated use getVillaById */
export function getVillaByNumber(villaNumber: string): VillaRecord | undefined {
  return getVillaById(villaNumber)
}

export function updateVilla(
  villaNumber: string,
  patch: Partial<VillaRecord>,
): void {
  villas = villas.map((v) =>
    v.villaNumber === villaNumber
      ? { ...v, ...patch, phases: patch.phases ?? v.phases }
      : v,
  )
  emit()
}

export function addVilla(record: VillaRecord): void {
  if (villas.some((v) => v.villaNumber === record.villaNumber)) return
  villas = [...villas, { ...record, phases: [...record.phases] }]
  emit()
}

export function listVillaNumbers(): string[] {
  return villas.map((v) => v.villaNumber)
}

export function buildLocation(
  areaName: string,
  block: string,
  plot: string,
): string {
  return `${areaName} - Block ${block} - Plot ${plot}`
}

export { defaultVillaPhases }

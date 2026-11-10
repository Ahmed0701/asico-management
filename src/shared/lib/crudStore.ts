import { create } from "zustand"

interface CrudState<T extends { id: string }> {
  items: T[]
  add: (input: Omit<T, "id">) => T
  update: (id: string, patch: Partial<T>) => void
  remove: (id: string) => void
}

export function createCrudStore<T extends { id: string }>(
  initial: T[],
  prefix: string,
) {
  return create<CrudState<T>>((set, get) => ({
    items: initial,
    add: (input) => {
      const next = {
        ...input,
        id: `${prefix}-${String(get().items.length + 1 + Math.floor(Math.random() * 90)).padStart(2, "0")}`,
      } as T
      set((s) => ({ items: [next, ...s.items] }))
      return next
    },
    update: (id, patch) =>
      set((s) => ({
        items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      })),
    remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  }))
}

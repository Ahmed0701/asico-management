import { describe, expect, it } from "vitest"
import type { MaterialDelivery } from "../api"
import { vendorsOf } from "./VillaVendorsCard"

type TestFactory = {
  id: string
  name: string
  type: "SWITCHGEAR" | "CABLE"
}

const delivery = (
  id: string,
  factory: TestFactory,
  deliveryDate: string,
): MaterialDelivery =>
  ({
    id,
    villa: { id: "v1", villaNumber: "V-1" },
    factory,
    lines: [],
    noteNumber: null,
    deliveryDate,
  }) as unknown as MaterialDelivery

const abb = { id: "f1", name: "ABB Kuwait", type: "SWITCHGEAR" as const }
const siemens = { id: "f2", name: "Siemens", type: "SWITCHGEAR" as const }
const gulfCable = { id: "f3", name: "Gulf Cable", type: "CABLE" as const }

describe("vendorsOf", () => {
  it("lists the factories of one type that delivered to the villa, the latest first, with how many times", () => {
    const deliveries = [
      delivery("d1", abb, "2026-10-01"),
      delivery("d2", gulfCable, "2026-10-05"),
      delivery("d3", siemens, "2026-11-02"),
      delivery("d4", abb, "2026-10-20"),
    ]

    expect(vendorsOf(deliveries, "SWITCHGEAR")).toEqual([
      { id: "f2", name: "Siemens", deliveries: 1, lastDate: "2026-11-02" },
      { id: "f1", name: "ABB Kuwait", deliveries: 2, lastDate: "2026-10-20" },
    ])
    expect(vendorsOf(deliveries, "CABLE")).toEqual([
      { id: "f3", name: "Gulf Cable", deliveries: 1, lastDate: "2026-10-05" },
    ])
  })

  it("gives none when no factory of that type delivered", () => {
    expect(vendorsOf([delivery("d1", abb, "2026-10-01")], "CABLE")).toEqual([])
  })
})

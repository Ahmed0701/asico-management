import { describe, expect, it } from "vitest"
import { itemColors } from "./itemColor"

const keys = (name: string) => itemColors(name).map((color) => color.key)

describe("itemColors", () => {
  it("finds a color word in English or Arabic, whatever its case", () => {
    expect(keys("Cable 4mm Red")).toEqual(["red"])
    expect(keys("CABLE 6MM BLUE")).toEqual(["blue"])
    expect(keys("سلك 4 مم أحمر")).toEqual(["red"])
    expect(keys("سلك 4 مم احمر")).toEqual(["red"])
    expect(keys("Grey box")).toEqual(["grey"])
    expect(keys("Gray box")).toEqual(["grey"])
  })

  it("keeps the order of the name, each color once, and splits on digits and signs", () => {
    expect(keys("Earth Yellow/Green 16mm")).toEqual(["yellow", "green"])
    expect(keys("4mm-Red red")).toEqual(["red"])
  })

  it("finds no color in a word that only contains one", () => {
    expect(keys("Redundant cable")).toEqual([])
    expect(keys("Box 3x3")).toEqual([])
  })

  it("shows black and white with a dot, since their text would vanish on one of the themes", () => {
    expect(itemColors("Cable Black")[0]).toMatchObject({
      key: "black",
      swatchOnly: true,
    })
    expect(itemColors("Box White")[0]).toMatchObject({
      key: "white",
      swatchOnly: true,
    })
    expect(itemColors("Cable Red")[0]).toMatchObject({ swatchOnly: false })
  })
})

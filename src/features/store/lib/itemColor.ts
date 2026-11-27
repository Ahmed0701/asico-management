/** A color an item name can carry: the text color, and whether text in it can be read on any background. */
export type ItemColor = {
  key: string
  css: string
  /** Black and white are not used as text colors: a dot of the color is shown instead. */
  swatchOnly: boolean
}

// The words of each color, English and Arabic (with and without the hamza), as people write them on a cable or a box.
type ColorWords = {
  key: string
  css: string
  swatchOnly?: true
  words: string[]
}

const COLORS: ColorWords[] = [
  { key: "red", css: "#dc2626", words: ["red", "أحمر", "احمر", "حمراء"] },
  { key: "blue", css: "#2563eb", words: ["blue", "أزرق", "ازرق", "زرقاء"] },
  { key: "green", css: "#16a34a", words: ["green", "أخضر", "اخضر", "خضراء"] },
  { key: "yellow", css: "#ca8a04", words: ["yellow", "أصفر", "اصفر", "صفراء"] },
  { key: "orange", css: "#ea580c", words: ["orange", "برتقالي"] },
  { key: "brown", css: "#92400e", words: ["brown", "بني"] },
  { key: "grey", css: "#6b7280", words: ["grey", "gray", "رمادي"] },
  { key: "purple", css: "#9333ea", words: ["purple", "violet", "بنفسجي"] },
  { key: "pink", css: "#db2777", words: ["pink", "وردي", "بمبي"] },
  {
    key: "black",
    css: "#111827",
    swatchOnly: true,
    words: ["black", "أسود", "اسود", "سوداء"],
  },
  {
    key: "white",
    css: "#ffffff",
    swatchOnly: true,
    words: ["white", "أبيض", "ابيض", "بيضاء"],
  },
]

// A word is a run of letters (Latin or Arabic); digits, spaces, dashes and slashes separate words ("Yellow/Green", "4mm-Red").
const WORD = /[A-Za-z؀-ۿ]+/g

/** The colors an item name mentions, in the order it mentions them, each once. */
export function itemColors(name: string): ItemColor[] {
  const found: ItemColor[] = []
  for (const match of name.matchAll(WORD)) {
    const word = match[0].toLowerCase()
    const color = COLORS.find((entry) => entry.words.includes(word))
    if (color && !found.some((entry) => entry.key === color.key)) {
      found.push({
        key: color.key,
        css: color.css,
        swatchOnly: color.swatchOnly === true,
      })
    }
  }
  return found
}

/** The text color of a name in a plain text field (the first color it can be read in), or none. */
export function itemTextStyle(name: string): { color: string } | undefined {
  const readable = itemColors(name).find((color) => !color.swatchOnly)
  return readable ? { color: readable.css } : undefined
}

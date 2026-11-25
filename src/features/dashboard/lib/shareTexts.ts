import { formatDashboardPercent } from "./formatDashboardNumber"

/**
 * The share of each count in their total, as whole percents that add up to 100 (the largest remainders are rounded up). A
 * part that exists never reads as 0%, nor one short of everything as 100%.
 */
export function shareTexts(counts: number[]): string[] {
  const total = counts.reduce((sum, count) => sum + count, 0)
  if (total <= 0) return counts.map(() => formatDashboardPercent(0))
  const exact = counts.map((count) => (count / total) * 100)
  const whole = exact.map(Math.floor)
  const missing = 100 - whole.reduce((sum, n) => sum + n, 0)
  exact
    .map((share, index) => ({ index, rest: share - Math.floor(share) }))
    .sort((a, b) => b.rest - a.rest)
    .slice(0, missing)
    .forEach(({ index }) => {
      whole[index] = (whole[index] ?? 0) + 1
    })
  return exact.map((share, index) => {
    if (share > 0 && share < 1) return `<${formatDashboardPercent(1)}`
    if (share > 99 && share < 100) return `>${formatDashboardPercent(99)}`
    return formatDashboardPercent(whole[index] ?? 0)
  })
}

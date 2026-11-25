import { formatDashboardPercent } from "../lib/formatDashboardNumber"

const SIZE = 132
const STROKE = 12
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
// Round ends reach past the arc by half the stroke each: from here on they would close a ring that is not full.
const FLAT_ENDS_FROM = 1 - (2 * STROKE) / CIRCUMFERENCE

/** A percentage (0 to 100) as a ring that fills clockwise from the top, with the figure in the middle. */
export default function DashboardProgressRing({ value }: { value: number }) {
  const filled = Math.min(100, Math.max(0, value)) / 100
  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: SIZE, height: SIZE }}
    >
      <svg
        aria-hidden
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="-rotate-90"
        fill="none"
        strokeWidth={STROKE}
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          className="stroke-accent/15"
        />
        {/* Nothing at 0: a round cap would still draw a dot. */}
        {filled > 0 && (
          <circle
            data-slot="progress-ring-fill"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeLinecap={filled < FLAT_ENDS_FROM ? "round" : "butt"}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - filled)}
            className="stroke-accent transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
          />
        )}
      </svg>
      <p
        dir="ltr"
        className="absolute text-3xl font-semibold tabular-nums tracking-tight"
      >
        {formatDashboardPercent(value)}
      </p>
    </div>
  )
}

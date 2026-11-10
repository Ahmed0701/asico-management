import type { SVGProps } from "react"

const paths = {
  dashboard: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
  plus: "M12 5v14M5 12h14",
  folder:
    "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  unlock: "M7 11V8a5 5 0 0 1 9.5-2M5 11h14v10H5z",
  pipe: "M4 8h9a3 3 0 0 1 3 3v2a3 3 0 0 0 3 3h1M4 8v0M2 6v4M22 14v4",
  users:
    "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 20v-1a4 4 0 0 0-3-3.9M16 4.1a3.5 3.5 0 0 1 0 6.8",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  log: "M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7",
  hardhat: "M3 18h18M5 18v-3a7 7 0 0 1 14 0v3M12 8V5M9 9V6.5M15 9V6.5",
  ruler: "M3 17L17 3l4 4L7 21zM8 12l2 2M11 9l2 2M14 6l2 2",
  menu: "M4 6h16M4 12h16M4 18h16",
  x: "M6 6l12 12M18 6L6 18",
  chevronDown: "M6 9l6 6 6-6",
  chevronLeft: "M15 6l-6 6 6 6",
  chevronRight: "M9 6l6 6-6 6",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  moon: "M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  edit: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  download: "M12 4v11M7 11l5 5 5-5M5 20h14",
  upload: "M12 16V5M7 9l5-5 5 5M5 20h14",
  file: "M6 3h9l4 4v14H6zM14 3v5h5",
  check: "M5 12l5 5 9-10",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  key: "M14 10a4 4 0 1 0-3.5 3.97L11 15h2v2h2v2h3v-3l-6-6",
  alert: "M12 4l9 16H3zM12 10v4M12 17v.5",
  sortAsc: "M12 19V5M6 11l6-6 6 6",
  sortDesc: "M12 5v14M6 13l6 6 6-6",
  sort: "M8 9l4-4 4 4M8 15l4 4 4-4",
  globe:
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",
  panel: "M4 4h16v16H4zM9 4v16",
  filter: "M3 5h18l-7 8v6l-4-2v-4z",
  inbox: "M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 21a2 2 0 0 1-3.4 0",
} as const

export type IconName = keyof typeof paths

export default function Icon({
  name,
  size = 18,
  ...rest
}: {
  name: IconName
  size?: number
} & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  )
}

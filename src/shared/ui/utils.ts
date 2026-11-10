import { clsx, type ClassValue } from "clsx"

import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Radix overlays portaled to document.body that must stay interactive inside dialogs/sheets. */

const PORTAL_OVERLAY_SELECTOR =
  '[data-slot="select-content"], [data-slot="popover-content"], [data-slot="dropdown-menu-content"], [data-slot="dropdown-menu-sub-content"], [data-item-search-dropdown]'

export function isPortaledOverlayTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest(PORTAL_OVERLAY_SELECTOR))
  )
}

"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import type { NavItem } from "./nav-items"

/**
 * A row of a sidebar's main navigation.
 *
 * Lives on its own because both panels — trainer and merchant — render the same
 * row with the same active treatment. The rest of each sidebar differs enough
 * (the trainer's profile card, the merchant's simpler header) that sharing the
 * whole component would have meant a shell with two modes; sharing the row is
 * where the actual duplication was.
 */

export function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl py-2.5 pr-3 pl-6 text-body font-medium",
        "transition-all duration-300 ease-out motion-reduce:transition-none",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/60 hover:translate-x-0.5 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground motion-reduce:hover:translate-x-0",
      )}
    >
      {active && <DumbbellIndicator />}
      <Icon
        className={cn(
          "size-5 transition-transform duration-300 ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100",
          active && "text-primary",
        )}
      />
      {item.label}
    </Link>
  )
}

/**
 * Active-item marker: a dumbbell stood on its end against the left edge of the
 * row, instead of the usual pill. It only renders inside the active link, so
 * navigating unmounts it from the old row and replays the enter animation on
 * the new one.
 */
function DumbbellIndicator() {
  return (
    <svg
      viewBox="0 0 14 44"
      aria-hidden
      className="absolute top-1/2 left-1.5 h-7 w-2.5 -translate-y-1/2 fill-primary drop-shadow-[0_0_5px_var(--primary)] duration-500 ease-out animate-in fade-in zoom-in-50 slide-in-from-left-2 motion-reduce:animate-none"
    >
      {/* Outer plate, inner plate, handle, and the same pair mirrored. */}
      <rect x="0" y="4" width="14" height="6" rx="3" />
      <rect x="2.5" y="10" width="9" height="4" rx="2" />
      <rect x="5" y="14" width="4" height="16" rx="2" />
      <rect x="2.5" y="30" width="9" height="4" rx="2" />
      <rect x="0" y="34" width="14" height="6" rx="3" />
    </svg>
  )
}

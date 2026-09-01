"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { brandNavItems } from "./nav-items"

function isActive(pathname: string, href: string) {
  if (href === "/comercio") return pathname === "/comercio"
  return pathname.startsWith(href)
}

/** Four entries fit comfortably on a 360 px screen; the trainer's five is the ceiling. */
export function BrandBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-sidebar/95 backdrop-blur md:hidden"
    >
      {brandNavItems.map((item) => {
        const active = isActive(pathname, item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-caption font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

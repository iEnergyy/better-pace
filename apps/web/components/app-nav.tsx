"use client"

import { cn } from "@workspace/ui/lib/utils"
import { Activity, LayoutDashboard, Settings, Sparkles } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/activities", label: "Activities", icon: Activity },
  { href: "/insights", label: "Insights", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
] as const

export function AppNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
              active && "bg-accent text-accent-foreground"
            )}
          >
            <Icon className="size-3.5 opacity-70" aria-hidden />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

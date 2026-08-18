"use client"

import { buttonVariants } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

type WeekProps = {
  mode: "week"
  /** ISO Monday YYYY-MM-DD for the displayed week */
  periodKey: string
  label: string
  prevHref: string
  nextHref: string
  thisPeriodHref: string
  lastPeriodHref: string
  isThisPeriod: boolean
  isLastPeriod: boolean
}

type MonthProps = {
  mode: "month"
  /** YYYY-MM for the displayed month */
  periodKey: string
  label: string
  prevHref: string
  nextHref: string
  thisPeriodHref: string
  lastPeriodHref: string
  isThisPeriod: boolean
  isLastPeriod: boolean
}

type SummaryPeriodFilterProps = WeekProps | MonthProps

function mondayContaining(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number)
  const date = new Date(Date.UTC(y!, m! - 1, d!, 12))
  const day = date.getUTCDay() // 0 Sun … 6 Sat
  const diff = day === 0 ? -6 : 1 - day
  date.setUTCDate(date.getUTCDate() + diff)
  const yy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(date.getUTCDate()).padStart(2, "0")
  return `${yy}-${mm}-${dd}`
}

export function SummaryPeriodFilter(props: SummaryPeriodFilterProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const {
    mode,
    periodKey,
    label,
    prevHref,
    nextHref,
    thisPeriodHref,
    lastPeriodHref,
    isThisPeriod,
    isLastPeriod,
  } = props

  function goWeek(dateValue: string) {
    if (!dateValue) return
    const week = mondayContaining(dateValue)
    startTransition(() => {
      router.push(`/summaries/week?week=${week}`)
    })
  }

  function goMonth(monthValue: string) {
    if (!monthValue) return
    startTransition(() => {
      router.push(`/summaries/month?month=${monthValue}`)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="bg-muted inline-flex rounded-md p-0.5 text-sm">
          <Link
            href={
              mode === "week"
                ? `/summaries/week?week=${periodKey}`
                : "/summaries/week"
            }
            className={cn(
              "rounded-sm px-3 py-1.5 transition-colors",
              mode === "week"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-current={mode === "week" ? "page" : undefined}
          >
            Week
          </Link>
          <Link
            href={
              mode === "month"
                ? `/summaries/month?month=${periodKey}`
                : "/summaries/month"
            }
            className={cn(
              "rounded-sm px-3 py-1.5 transition-colors",
              mode === "month"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-current={mode === "month" ? "page" : undefined}
          >
            Month
          </Link>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Link
            href={thisPeriodHref}
            className={cn(
              buttonVariants({
                size: "sm",
                variant: isThisPeriod ? "secondary" : "outline",
              })
            )}
          >
            {mode === "week" ? "This week" : "This month"}
          </Link>
          <Link
            href={lastPeriodHref}
            className={cn(
              buttonVariants({
                size: "sm",
                variant: isLastPeriod ? "secondary" : "outline",
              })
            )}
          >
            {mode === "week" ? "Last week" : "Last month"}
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Link
            href={prevHref}
            aria-label="Previous period"
            className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
          >
            ← Prev
          </Link>
          <p className="min-w-[10rem] text-center text-sm font-medium tabular-nums">
            {label}
          </p>
          <Link
            href={nextHref}
            aria-label="Next period"
            className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
          >
            Next →
          </Link>
        </div>

        {mode === "week" ? (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground whitespace-nowrap">
              Jump to week of
            </span>
            <Input
              type="date"
              className="h-9 w-auto"
              defaultValue={periodKey}
              disabled={pending}
              onChange={(e) => goWeek(e.target.value)}
            />
          </label>
        ) : (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground whitespace-nowrap">
              Jump to month
            </span>
            <Input
              type="month"
              className="h-9 w-auto"
              defaultValue={periodKey}
              disabled={pending}
              onChange={(e) => goMonth(e.target.value)}
            />
          </label>
        )}
      </div>
    </div>
  )
}

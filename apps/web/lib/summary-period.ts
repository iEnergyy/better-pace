import {
  addDaysYmd,
  startOfIsoWeekDate,
  startOfMonthDate,
  ymdKey,
  zonedYmd,
  type ZonedYmd,
} from "@pacepilot/core"

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const YEAR_MONTH = /^\d{4}-\d{2}$/

export function parseIsoDateParam(value: string | undefined): ZonedYmd | null {
  if (!value || !ISO_DATE.test(value)) return null
  const [y, m, d] = value.split("-").map(Number)
  if (!y || !m || !d) return null
  return { year: y, month: m, day: d }
}

export function parseYearMonthParam(
  value: string | undefined
): { year: number; month: number } | null {
  if (!value || !YEAR_MONTH.test(value)) return null
  const [y, m] = value.split("-").map(Number)
  if (!y || !m || m < 1 || m > 12) return null
  return { year: y, month: m }
}

export function ymdToUtcDate(ymd: ZonedYmd): Date {
  return new Date(Date.UTC(ymd.year, ymd.month - 1, ymd.day))
}

export function formatYmd(ymd: ZonedYmd): string {
  return ymdKey(ymd)
}

export function formatWeekRangeLabel(weekStart: Date): string {
  const start = zonedYmd(weekStart, "UTC")
  const end = addDaysYmd(start, 6)
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  })
  const startLabel = fmt.format(
    new Date(Date.UTC(start.year, start.month - 1, start.day))
  )
  const endLabel = fmt.format(
    new Date(Date.UTC(end.year, end.month - 1, end.day))
  )
  return `${startLabel} – ${endLabel}, ${end.year}`
}

export function formatMonthLabel(monthStart: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(monthStart)
}

/** Resolve ISO week Monday from ?week=YYYY-MM-DD or legacy ?offset=N. */
export function resolveWeekStart(args: {
  timeZone: string
  week?: string
  offset?: string
  now?: Date
}): Date {
  const now = args.now ?? new Date()
  const parsed = parseIsoDateParam(args.week)
  if (parsed) {
    return startOfIsoWeekDate(ymdToUtcDate(parsed), "UTC")
  }
  const base = startOfIsoWeekDate(now, args.timeZone)
  const offset = Number(args.offset ?? "0") || 0
  if (offset === 0) return base
  const shifted = addDaysYmd(zonedYmd(base, "UTC"), offset * 7)
  return ymdToUtcDate(shifted)
}

/** Resolve calendar month start from ?month=YYYY-MM or legacy ?offset=N. */
export function resolveMonthStart(args: {
  timeZone: string
  month?: string
  offset?: string
  now?: Date
}): Date {
  const now = args.now ?? new Date()
  const parsed = parseYearMonthParam(args.month)
  if (parsed) {
    return new Date(Date.UTC(parsed.year, parsed.month - 1, 1))
  }
  const base = startOfMonthDate(now, args.timeZone)
  const offset = Number(args.offset ?? "0") || 0
  if (offset === 0) return base
  return new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + offset, 1)
  )
}

export function shiftWeekStart(weekStart: Date, weeks: number): Date {
  const shifted = addDaysYmd(zonedYmd(weekStart, "UTC"), weeks * 7)
  return ymdToUtcDate(shifted)
}

export function shiftMonthStart(monthStart: Date, months: number): Date {
  return new Date(
    Date.UTC(
      monthStart.getUTCFullYear(),
      monthStart.getUTCMonth() + months,
      1
    )
  )
}

export function weekHref(weekStart: Date): string {
  return `/summaries/week?week=${formatYmd(zonedYmd(weekStart, "UTC"))}`
}

export function monthHref(monthStart: Date): string {
  const y = monthStart.getUTCFullYear()
  const m = String(monthStart.getUTCMonth() + 1).padStart(2, "0")
  return `/summaries/month?month=${y}-${m}`
}

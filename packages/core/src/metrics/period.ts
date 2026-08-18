/**
 * Timezone-aware calendar helpers using Intl (no extra date dependency).
 */

export type ZonedYmd = { year: number; month: number; day: number }

export function zonedYmd(date: Date, timeZone: string): ZonedYmd {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)

  const year = Number(parts.find((p) => p.type === "year")?.value)
  const month = Number(parts.find((p) => p.type === "month")?.value)
  const day = Number(parts.find((p) => p.type === "day")?.value)
  return { year, month, day }
}

export function ymdKey(ymd: ZonedYmd): string {
  return `${ymd.year}-${String(ymd.month).padStart(2, "0")}-${String(ymd.day).padStart(2, "0")}`
}

/** Monday-based ISO weekday: Mon=1 … Sun=7 */
export function isoWeekday(ymd: ZonedYmd, timeZone: string): number {
  const noonUtcGuess = new Date(Date.UTC(ymd.year, ymd.month - 1, ymd.day, 12))
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(noonUtcGuess)
  const map: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  }
  return map[weekday] ?? 1
}

export function addDaysYmd(ymd: ZonedYmd, days: number): ZonedYmd {
  const d = new Date(Date.UTC(ymd.year, ymd.month - 1, ymd.day))
  d.setUTCDate(d.getUTCDate() + days)
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  }
}

/** Local Monday 00:00 as a UTC Date for the YMD Monday. */
export function startOfIsoWeekDate(date: Date, timeZone: string): Date {
  const ymd = zonedYmd(date, timeZone)
  const dow = isoWeekday(ymd, timeZone)
  const monday = addDaysYmd(ymd, 1 - dow)
  return new Date(Date.UTC(monday.year, monday.month - 1, monday.day))
}

export function startOfMonthDate(date: Date, timeZone: string): Date {
  const ymd = zonedYmd(date, timeZone)
  return new Date(Date.UTC(ymd.year, ymd.month - 1, 1))
}

export function daysBetweenYmd(a: ZonedYmd, b: ZonedYmd): number {
  const ms =
    Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)
  return Math.round(ms / 86_400_000)
}

"use client"

import { INTENSITY_LABELS, SPORTS } from "@pacepilot/core"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

export function ActivityFilters() {
  const router = useRouter()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  function apply(formData: FormData) {
    const next = new URLSearchParams()
    const sport = String(formData.get("sport") ?? "all")
    const intensity = String(formData.get("intensity") ?? "all")
    const from = String(formData.get("from") ?? "").trim()
    const to = String(formData.get("to") ?? "").trim()
    const minDuration = String(formData.get("minDuration") ?? "").trim()
    if (sport && sport !== "all") next.set("sport", sport)
    if (intensity && intensity !== "all") next.set("intensity", intensity)
    if (from) next.set("from", from)
    if (to) next.set("to", to)
    if (minDuration) next.set("minDuration", minDuration)
    startTransition(() => {
      router.push(`/activities?${next.toString()}`)
    })
  }

  return (
    <form
      action={apply}
      className="flex flex-wrap items-end gap-3 text-sm"
    >
      <label className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs">Sport</span>
        <select
          name="sport"
          defaultValue={params.get("sport") ?? "all"}
          className="border-input bg-background h-9 rounded-md border px-2"
        >
          <option value="all">All</option>
          {SPORTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs">Intensity</span>
        <select
          name="intensity"
          defaultValue={params.get("intensity") ?? "all"}
          className="border-input bg-background h-9 rounded-md border px-2"
        >
          <option value="all">All</option>
          {INTENSITY_LABELS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs">From</span>
        <Input
          type="date"
          name="from"
          defaultValue={params.get("from") ?? ""}
          className="h-9 w-auto"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs">To</span>
        <Input
          type="date"
          name="to"
          defaultValue={params.get("to") ?? ""}
          className="h-9 w-auto"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs">Min minutes</span>
        <Input
          type="number"
          name="minDuration"
          min={0}
          defaultValue={params.get("minDuration") ?? ""}
          className="h-9 w-24"
        />
      </label>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Filtering…" : "Apply"}
      </Button>
    </form>
  )
}

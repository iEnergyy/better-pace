import { SPORTS, type Sport } from "@pacepilot/core"
import { Badge } from "@workspace/ui/components/badge"

const sportLabels: Record<Sport, string> = {
  running: "Running",
  padel: "Padel",
  cycling: "Cycling",
  swimming: "Swimming",
  walking: "Walking",
  hiking: "Hiking",
  strength: "Strength",
  other: "Other",
}

export function SportCatalog() {
  return (
    <div className="flex flex-wrap gap-2">
      {SPORTS.map((sport) => (
        <Badge key={sport} variant="secondary">
          {sportLabels[sport]}
        </Badge>
      ))}
    </div>
  )
}

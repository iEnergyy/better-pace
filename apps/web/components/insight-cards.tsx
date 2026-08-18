import type { InsightCard } from "@pacepilot/core"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

const severityClass: Record<InsightCard["severity"], string> = {
  info: "border-border/80",
  positive: "border-primary/40 bg-primary/5",
  warning: "border-amber-600/40 bg-amber-500/5",
}

export function InsightCards({ cards }: { cards: InsightCard[] }) {
  if (cards.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No insight cards yet — keep syncing weeks of data.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {cards.map((card) => (
        <li
          key={card.id}
          className={cn(
            "rounded-lg border px-4 py-3",
            severityClass[card.severity]
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{card.title}</p>
            <Badge variant="secondary" className="text-[10px] uppercase">
              {card.severity}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            {card.body}
          </p>
        </li>
      ))}
    </ul>
  )
}

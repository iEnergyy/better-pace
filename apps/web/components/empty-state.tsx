import { Button, buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}) {
  return (
    <div className="border-border/70 flex flex-col items-start gap-3 border-t border-dashed py-16">
      <h2 className="text-lg font-medium tracking-tight">{title}</h2>
      <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && actionHref ? (
        <a
          href={actionHref}
          className={cn(buttonVariants({ variant: "outline" }), "mt-2")}
        >
          {actionLabel}
        </a>
      ) : actionLabel ? (
        <Button variant="outline" className="mt-2" disabled>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}

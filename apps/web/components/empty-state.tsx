import { Button } from "@workspace/ui/components/button"

export function EmptyState({
  title,
  description,
  actionLabel,
}: {
  title: string
  description: string
  actionLabel?: string
}) {
  return (
    <div className="border-border/70 flex flex-col items-start gap-3 border-t border-dashed py-16">
      <h2 className="text-lg font-medium tracking-tight">{title}</h2>
      <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
        {description}
      </p>
      {actionLabel ? (
        <Button variant="outline" className="mt-2" disabled>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}

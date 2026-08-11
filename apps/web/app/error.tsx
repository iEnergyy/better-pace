"use client"

import { Button } from "@workspace/ui/components/button"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-start gap-4 py-16">
      <h2 className="text-lg font-medium tracking-tight">
        Something went wrong
      </h2>
      <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
        {error.message ||
          "An unexpected error occurred while loading this page."}
      </p>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  )
}

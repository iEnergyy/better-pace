import { Skeleton } from "@workspace/ui/components/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-64 max-w-full" />
      <Skeleton className="h-16 w-full max-w-xl" />
      <div className="flex flex-wrap gap-2">
        {["a", "b", "c", "d", "e", "f"].map((id) => (
          <Skeleton key={id} className="h-6 w-20 rounded-full" />
        ))}
      </div>
    </div>
  )
}

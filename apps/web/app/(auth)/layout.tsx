import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-border/60 bg-background/70 sticky top-0 z-40 border-b backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-lg items-center px-4 sm:px-6">
          <Link href="/sign-in" className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tracking-tight">
              PacePilot
            </span>
            <span className="text-muted-foreground hidden text-xs sm:inline">
              athlete intelligence
            </span>
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        {children}
      </main>
    </div>
  )
}

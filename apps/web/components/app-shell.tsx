import Link from "next/link"
import { AppNav } from "@/components/app-nav"
import { SignOutButton } from "@/components/sign-out-button"

export function AppShell({
  children,
  userEmail,
}: {
  children: React.ReactNode
  userEmail?: string
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-border/60 bg-background/70 sticky top-0 z-40 border-b backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tracking-tight">
              PacePilot
            </span>
            <span className="text-muted-foreground hidden text-xs sm:inline">
              athlete intelligence
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <AppNav />
            {userEmail ? (
              <span className="text-muted-foreground hidden max-w-40 truncate text-xs md:inline">
                {userEmail}
              </span>
            ) : null}
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  )
}

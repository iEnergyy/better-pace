import type { Metadata } from "next"
import { IBM_Plex_Mono, Outfit } from "next/font/google"
import "@workspace/ui/globals.css"
import { cn } from "@workspace/ui/lib/utils"
import { AppShell } from "@/components/app-shell"
import { ThemeProvider } from "@/components/theme-provider"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
})

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    default: "PacePilot",
    template: "%s · PacePilot",
  },
  description:
    "Strava tells you what you did. PacePilot tells you what it means.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        outfit.variable,
        plexMono.variable,
        "font-sans"
      )}
    >
      <body>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  )
}

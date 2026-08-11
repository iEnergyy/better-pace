"use client"

import { Button } from "@workspace/ui/components/button"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/auth-client"

export function SignOutButton() {
  const router = useRouter()

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        await signOut()
        router.push("/sign-in")
        router.refresh()
      }}
    >
      Sign out
    </Button>
  )
}

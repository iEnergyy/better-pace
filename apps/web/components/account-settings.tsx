"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { softDeleteAccount, updateDisplayName } from "@/lib/actions/account"

type AccountSettingsProps = {
  email: string
  displayName: string
  preferredUnits: "metric" | "imperial"
  deletedAt: Date | null
}

export function AccountSettings({
  email,
  displayName,
  preferredUnits,
  deletedAt,
}: AccountSettingsProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onUpdate(formData: FormData) {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await updateDisplayName(formData)
      if ("error" in result && result.error) {
        setError(result.error)
        return
      }
      setMessage("Profile saved.")
      router.refresh()
    })
  }

  function onSoftDelete() {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      await softDeleteAccount()
      router.push("/sign-in")
      router.refresh()
    })
  }

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Account email and athlete display name.
          </CardDescription>
        </CardHeader>
        <form action={onUpdate}>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  value={email}
                  disabled
                  readOnly
                />
                <FieldDescription>
                  Email is managed by authentication and cannot be changed here
                  yet.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="preferredUnits">Distance units</FieldLabel>
                <select
                  id="preferredUnits"
                  name="preferredUnits"
                  defaultValue={preferredUnits}
                  className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                >
                  <option value="metric">Kilometers (metric)</option>
                  <option value="imperial">Miles (imperial)</option>
                </select>
                <FieldDescription>
                  Used on dashboard, activities, summaries, and insights.
                </FieldDescription>
              </Field>
              <Field data-invalid={error ? true : undefined}>
                <FieldLabel htmlFor="displayName">Display name</FieldLabel>
                <Input
                  id="displayName"
                  name="displayName"
                  defaultValue={displayName}
                  required
                  aria-invalid={error ? true : undefined}
                />
                {error ? <FieldError>{error}</FieldError> : null}
                {message ? (
                  <FieldDescription>{message}</FieldDescription>
                ) : null}
                {deletedAt ? (
                  <FieldDescription>
                    Soft-delete requested on {deletedAt.toLocaleString()}. Full
                    account wipe lands in phase 0.8; you can still sign back in
                    with this email.
                  </FieldDescription>
                ) : null}
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Delete account</CardTitle>
          <CardDescription>
            Soft-delete stub only. Marks your athlete profile deleted and signs
            you out. Auth credentials remain until full deletion in 0.8.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={onSoftDelete}
          >
            Soft-delete account
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

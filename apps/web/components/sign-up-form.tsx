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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { signUp } from "@/lib/auth-client"

export function SignUpForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const form = new FormData(event.currentTarget)
    const name = String(form.get("name") ?? "")
    const email = String(form.get("email") ?? "")
    const password = String(form.get("password") ?? "")

    const result = await signUp.email({
      name,
      email,
      password,
    })

    setPending(false)

    if (result.error) {
      setError(result.error.message ?? "Could not create account")
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>
          Email and password for Phase 0. Creates your athlete profile on
          signup.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="name">Display name</FieldLabel>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                aria-invalid={error ? true : undefined}
              />
            </Field>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                aria-invalid={error ? true : undefined}
              />
            </Field>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                aria-invalid={error ? true : undefined}
              />
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Sign up"}
          </Button>
          <p className="text-muted-foreground text-center text-sm">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

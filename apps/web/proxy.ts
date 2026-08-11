import { getSessionCookie } from "better-auth/cookies"
import { type NextRequest, NextResponse } from "next/server"

const publicPaths = ["/sign-in", "/sign-up"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = getSessionCookie(request)
  const isPublicAuthPage = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

  if (!sessionCookie && !isPublicAuthPage) {
    const signIn = new URL("/sign-in", request.url)
    signIn.searchParams.set("next", pathname)
    return NextResponse.redirect(signIn)
  }

  if (sessionCookie && isPublicAuthPage) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

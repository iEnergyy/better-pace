import { DomainError } from "@pacepilot/core"
import type { ErrorHandler } from "hono"
import type { ApiErrorBody } from "../types"

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(
    JSON.stringify({
      level: "error",
      path: c.req.path,
      message: err.message,
      name: err.name,
    })
  )

  if (err instanceof DomainError) {
    const status = err.code === "NOT_FOUND" ? 404 : 400
    const body: ApiErrorBody = {
      error: { code: err.code, message: err.message },
    }
    return c.json(body, status)
  }

  const body: ApiErrorBody = {
    error: {
      code: "INTERNAL",
      message: "An unexpected error occurred",
    },
  }
  return c.json(body, 500)
}

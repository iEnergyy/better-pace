import type { Context, Next } from "hono"

export async function requestLogger(c: Context, next: Next) {
  const started = Date.now()
  await next()
  const ms = Date.now() - started
  console.log(
    JSON.stringify({
      level: "info",
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: ms,
    })
  )
}

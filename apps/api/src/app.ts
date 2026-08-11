import { Hono } from "hono"
import { cors } from "hono/cors"
import { serve } from "inngest/hono"
import { functions, inngest } from "./jobs/inngest"
import { errorHandler } from "./middleware/error"
import { requestLogger } from "./middleware/logger"
import { healthRoutes } from "./routes/health"
import { sportsRoutes } from "./routes/sports"

export function createApp() {
  const app = new Hono()

  app.use(
    "*",
    cors({
      origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
      credentials: true,
    })
  )
  app.use("*", requestLogger)
  app.onError(errorHandler)

  app.route("/health", healthRoutes)
  app.route("/sports", sportsRoutes)
  app.on(
    ["GET", "PUT", "POST"],
    "/api/inngest",
    serve({ client: inngest, functions })
  )

  app.notFound((c) =>
    c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: `Route not found: ${c.req.method} ${c.req.path}`,
        },
      },
      404
    )
  )

  return app
}

export type App = ReturnType<typeof createApp>

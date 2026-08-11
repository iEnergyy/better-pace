import { serve } from "@hono/node-server"
import { createApp } from "./app"

const port = Number(process.env.API_PORT ?? 3001)
const app = createApp()

const server = serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`PacePilot API listening on http://localhost:${info.port}`)
  }
)

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use. Stop the other process or set API_PORT.`
    )
    process.exit(1)
  }

  console.error(error)
  process.exit(1)
})

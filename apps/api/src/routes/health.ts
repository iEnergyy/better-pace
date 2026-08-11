import { Hono } from "hono"
import type { ApiSuccessBody, HealthResponse } from "../types"

export const healthRoutes = new Hono()

healthRoutes.get("/", (c) => {
  const payload: ApiSuccessBody<HealthResponse> = {
    data: {
      status: "ok",
      service: "pacepilot-api",
      timestamp: new Date().toISOString(),
    },
  }
  return c.json(payload)
})

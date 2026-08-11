import { SPORTS } from "@pacepilot/core"
import { Hono } from "hono"
import type { ApiSuccessBody, SportsCatalogResponse } from "../types"

/**
 * Hello path that proves apps/api imports domain types from `@pacepilot/core`
 * without redefining them.
 */
export const sportsRoutes = new Hono()

sportsRoutes.get("/", (c) => {
  const payload: ApiSuccessBody<SportsCatalogResponse> = {
    data: {
      sports: [...SPORTS],
    },
  }
  return c.json(payload)
})

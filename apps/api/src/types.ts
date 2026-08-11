export type ApiErrorBody = {
  error: {
    code: string
    message: string
  }
}

export type ApiSuccessBody<T> = {
  data: T
}

export type HealthResponse = {
  status: "ok"
  service: "pacepilot-api"
  timestamp: string
}

/**
 * Sports known to the domain — returned as a typed DTO at the API boundary.
 * Domain types stay in `@pacepilot/core`; HTTP shapes are defined here.
 */
export type SportsCatalogResponse = {
  sports: string[]
}

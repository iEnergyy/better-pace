export class DomainError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = "DomainError"
    this.code = code
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super("NOT_FOUND", `${entity} not found: ${id}`)
    this.name = "NotFoundError"
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super("VALIDATION", message)
    this.name = "ValidationError"
  }
}

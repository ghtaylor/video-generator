import { BaseError, ErrorOptions } from "./BaseError";

export class ValidationError extends BaseError {
  readonly name = "ValidationError";

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

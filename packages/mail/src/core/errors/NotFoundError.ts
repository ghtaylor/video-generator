import { BaseError, ErrorOptions } from "./BaseError";

export class NotFoundError extends BaseError {
  readonly name = "NotFoundError";

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

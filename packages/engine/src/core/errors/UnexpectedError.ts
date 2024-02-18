import { BaseError, ErrorOptions } from "./BaseError";

export class UnexpectedError extends BaseError {
  readonly name = "UnexpectedError";

  constructor(options?: ErrorOptions) {
    super("An unexpected error occurred", options);
  }
}

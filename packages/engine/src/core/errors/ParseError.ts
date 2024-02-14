import { BaseError, ErrorOptions } from "./BaseError";

export class ParseError extends BaseError {
  readonly name = "ParseError";

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

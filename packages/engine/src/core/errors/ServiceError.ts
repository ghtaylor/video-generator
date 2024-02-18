import { BaseError, ErrorOptions } from "./BaseError";

export class ServiceError extends BaseError {
  readonly name = "ServiceError";

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export class ServiceError extends Error {
  readonly name = "ServiceError";
  originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(originalError ? `${message} (${originalError.message})` : message);

    this.originalError = originalError;

    if (originalError) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }
}

export class NetworkError extends Error {
  readonly name = "NetworkError";
  originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(originalError ? `${message} (${originalError.message})` : message);

    this.originalError = originalError;

    if (originalError) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }
}

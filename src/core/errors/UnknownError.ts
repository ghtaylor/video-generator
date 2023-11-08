export class UnknownError extends Error {
  readonly name = "UnknownError";

  constructor(originalError?: Error) {
    const message = "An unknown error occurred";
    super(originalError ? `${message} (${originalError.message})` : message);

    if (originalError) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }
}

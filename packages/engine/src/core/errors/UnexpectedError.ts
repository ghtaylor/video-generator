export class UnexpectedError extends Error {
  readonly name = "UnexpectedError";

  constructor(originalError?: unknown) {
    const message = "An unexpected error occurred";
    super(originalError && originalError instanceof Error ? `${message} (${originalError.message})` : message);

    if (originalError && originalError instanceof Error) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }
}

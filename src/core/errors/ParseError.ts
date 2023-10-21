export class ParseError extends Error {
  readonly name = "ParseError";

  constructor(message: string, originalError?: Error) {
    super(originalError ? `${message}: ${originalError.message}` : message);

    if (originalError) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }
}

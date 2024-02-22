export type ErrorOptions = {
  originalError?: unknown;
  data?: unknown;
};

export abstract class BaseError extends Error {
  abstract readonly name: string;
  readonly originalError: ErrorOptions["originalError"];
  readonly data: ErrorOptions["data"];

  constructor(message: string, options?: ErrorOptions) {
    const { originalError, data } = options || {};

    super(originalError && originalError instanceof Error ? `${message} (${originalError.message})` : message);

    this.originalError = originalError;
    this.data = data;

    if (originalError && originalError instanceof Error) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }
}

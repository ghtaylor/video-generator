export class UnknownError extends Error {
  name = "UnknownError";

  constructor(message?: string) {
    super(message);
  }
}

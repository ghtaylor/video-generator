export class QuoteChunksInvalidError extends Error {
  name: string = "QuoteChunksInvalidError";

  constructor() {
    super("Quote chunks do not match quote text");
  }
}

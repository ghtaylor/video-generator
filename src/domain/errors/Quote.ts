export class QuoteChunksInvalidError extends Error {
  constructor() {
    super("Quote chunks do not match quote text");
  }
}

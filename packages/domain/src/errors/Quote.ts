import { Quote } from "../Quote";

export class QuoteChunksInvalidError extends Error {
  readonly name: string = "QuoteChunksInvalidError";

  constructor(readonly quote: Quote) {
    super(`Quote chunks do not match quote text`);
  }
}

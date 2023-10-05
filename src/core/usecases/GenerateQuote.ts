import { NetworkError } from "@core/errors/NetworkError";
import { UnknownError } from "@core/errors/UnknownError";
import { Queue } from "@core/queue";
import { QuoteService } from "@core/quoteService";
import { Quote } from "@domain/Quote";
import { QuoteChunksInvalidError } from "@domain/errors/Quote";
import { Result, ResultAsync, err, ok } from "neverthrow";

export class GenerateQuoteUseCase {
  constructor(
    private readonly quoteService: QuoteService,
    private readonly quoteQueue: Queue<Quote>,
  ) {}

  validateQuote(quote: Quote): Result<Quote, QuoteChunksInvalidError> {
    if (quote.chunks.join(" ") !== quote.text) return err(new QuoteChunksInvalidError());
    return ok(quote);
  }

  execute(): ResultAsync<Quote, QuoteChunksInvalidError | NetworkError | UnknownError> {
    return this.quoteService.generateQuote().andThen(this.validateQuote).andThen(this.quoteQueue.enqueue);
  }
}

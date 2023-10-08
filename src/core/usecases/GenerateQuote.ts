import { NetworkError } from "@core/errors/NetworkError";
import { ParseError } from "@core/errors/ParseError";
import { UnknownError } from "@core/errors/UnknownError";
import { ValidationError } from "@core/errors/ValidationError";
import { Queue } from "@core/queue";
import { QuoteService } from "@core/quoteService";
import { Quote } from "@domain/Quote";
import { ResultAsync } from "neverthrow";

export class GenerateQuoteUseCase {
  constructor(
    private readonly quoteService: QuoteService,
    private readonly quoteQueue: Queue<Quote>,
  ) {}

  execute(): ResultAsync<Quote, ParseError | ValidationError | NetworkError | UnknownError> {
    return this.quoteService.generateQuote().andThen(this.quoteQueue.enqueue);
  }
}

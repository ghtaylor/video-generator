import { NetworkError } from "@core/errors/NetworkError";
import { UnknownError } from "@core/errors/UnknownError";
import { Queue } from "@core/queue";
import { QuoteService } from "@core/quoteService";
import { Quote } from "@domain/Quote";
import { QuoteChunksInvalidError } from "@domain/errors/Quote";
import { Result, Unit } from "true-myth";

export class GenerateQuoteUseCase {
  constructor(
    private readonly quoteService: QuoteService,
    private readonly quoteQueue: Queue<Quote>,
  ) {}

  validateQuote(quote: Quote): Result<Unit, QuoteChunksInvalidError> {
    if (quote.chunks.join(" ") !== quote.text) return Result.err(new QuoteChunksInvalidError());
    return Result.ok(Unit);
  }

  async execute(): Promise<Result<Unit, QuoteChunksInvalidError | NetworkError | UnknownError>> {
    const quoteResult = await this.quoteService.generateQuote();
    if (quoteResult.isErr) return Result.err(quoteResult.error);
    const { value: quote } = quoteResult;

    const validateQuoteResult = this.validateQuote(quote);
    if (validateQuoteResult.isErr) return Result.err(validateQuoteResult.error);

    return this.quoteQueue.enqueue(quoteResult.value);
  }
}

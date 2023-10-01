import { QuoteService } from "@core/quoteService";
import { Quote } from "@domain/Quote";
import { QuoteChunksInvalidError } from "@domain/errors/Quote";
import { Result } from "true-myth";

export class GenerateQuoteUseCase {
  constructor(private quoteService: QuoteService) {}

  validateQuote(quote: Quote): Result<Quote, QuoteChunksInvalidError> {
    if (quote.chunks.join(" ") !== quote.text) return Result.err(new QuoteChunksInvalidError());
    return Result.ok(quote);
  }

  async execute(): Promise<Result<Quote, QuoteChunksInvalidError>> {
    const quote = await this.quoteService.generateQuote();
    return this.validateQuote(quote);
  }
}

import { ParseError } from "@core/errors/ParseError";
import { ServiceError } from "@core/errors/ServiceError";
import { UnexpectedError } from "@core/errors/UnexpectedError";
import { ProgressReporter } from "@core/progressReporter";
import { QuoteService } from "@core/quoteService";
import { Quote } from "@video-generator/domain/Quote";
import { QuoteChunksInvalidError } from "@video-generator/domain/errors/Quote";
import { ResultAsync } from "neverthrow";

export class GenerateQuoteUseCase {
  constructor(
    private readonly quoteService: QuoteService,
    private readonly progressReporter: ProgressReporter,
  ) {}

  execute(prompt: string): ResultAsync<Quote, ParseError | QuoteChunksInvalidError | ServiceError | UnexpectedError> {
    return this.progressReporter
      .reportProgress({ state: "GENERATING_QUOTE", progress: 0.25 })
      .andThen(() => this.quoteService.generateQuote(prompt));
  }
}

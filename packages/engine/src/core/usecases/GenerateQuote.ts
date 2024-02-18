import { ParseError } from "@core/errors/ParseError";
import { ServiceError } from "@core/errors/ServiceError";
import { UnexpectedError } from "@core/errors/UnexpectedError";
import { ValidationError } from "@core/errors/ValidationError";
import { QuoteService } from "@core/quoteService";
import { Quote } from "@video-generator/domain/Quote";
import { ResultAsync } from "neverthrow";

export class GenerateQuoteUseCase {
  constructor(private readonly quoteService: QuoteService) {}

  execute(prompt: string): ResultAsync<Quote, ParseError | ValidationError | ServiceError | UnexpectedError> {
    return this.quoteService.generateQuote(prompt);
  }
}

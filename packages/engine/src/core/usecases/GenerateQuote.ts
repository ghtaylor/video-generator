import { ServiceError } from "@core/errors/ServiceError";
import { ParseError } from "@core/errors/ParseError";
import { UnknownError } from "@core/errors/UnknownError";
import { ValidationError } from "@core/errors/ValidationError";
import { MessageSender } from "@core/messageSender";
import { QuoteService } from "@core/quoteService";
import { Quote } from "@video-generator/domain/Quote";
import { ResultAsync } from "neverthrow";

export class GenerateQuoteUseCase {
  constructor(
    private readonly quoteService: QuoteService,
    private readonly onComplete: MessageSender<Quote>,
  ) {}

  execute(prompt: string): ResultAsync<Quote, ParseError | ValidationError | ServiceError | UnknownError> {
    return this.quoteService.generateQuote(prompt).andThen(this.onComplete.send.bind(this.onComplete));
  }
}

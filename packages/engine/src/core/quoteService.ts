import { Quote } from "@video-generator/domain/Quote";
import { ResultAsync } from "neverthrow";
import { NetworkError } from "@core/errors/NetworkError";
import { UnknownError } from "@core/errors/UnknownError";
import { ParseError } from "@core/errors/ParseError";
import { ValidationError } from "@core/errors/ValidationError";

export interface QuoteService {
  generateQuote(prompt: string): ResultAsync<Quote, ValidationError | ParseError | NetworkError | UnknownError>;
}

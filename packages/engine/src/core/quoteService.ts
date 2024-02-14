import { Quote } from "@video-generator/domain/Quote";
import { ResultAsync } from "neverthrow";
import { ServiceError } from "@core/errors/ServiceError";
import { ParseError } from "@core/errors/ParseError";
import { ValidationError } from "@core/errors/ValidationError";
import { UnexpectedError } from "./errors/UnexpectedError";

export interface QuoteService {
  generateQuote(prompt: string): ResultAsync<Quote, ValidationError | ParseError | ServiceError | UnexpectedError>;
}

import { Quote } from "@domain/Quote";
import { ResultAsync } from "neverthrow";
import { NetworkError } from "./errors/NetworkError";
import { UnknownError } from "./errors/UnknownError";
import { ParseError } from "./errors/ParseError";
import { ValidationError } from "./errors/ValidationError";

export interface QuoteService {
  generateQuote(): ResultAsync<Quote, ValidationError | ParseError | NetworkError | UnknownError>;
}

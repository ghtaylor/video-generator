import { Quote } from "@domain/Quote";
import { ResultAsync } from "neverthrow";
import { NetworkError } from "./errors/NetworkError";
import { UnknownError } from "./errors/UnknownError";

export interface QuoteService {
  generateQuote(): ResultAsync<Quote, NetworkError | UnknownError>;
}

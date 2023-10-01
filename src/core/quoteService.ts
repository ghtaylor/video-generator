import { Quote } from "@domain/Quote";
import { Result } from "true-myth";
import { NetworkError } from "./errors/NetworkError";
import { UnknownError } from "./errors/UnknownError";

export interface QuoteService {
  generateQuote(): Promise<Result<Quote, NetworkError | UnknownError>>;
}

import { Quote } from "domain/Quote";

export interface QuoteService {
  generateQuote(): Promise<Quote>;
}

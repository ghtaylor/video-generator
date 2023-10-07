import { NetworkError } from "@core/errors/NetworkError";
import { ParseError } from "@core/errors/ParseError";
import { UnknownError } from "@core/errors/UnknownError";
import { ValidationError } from "@core/errors/ValidationError";
import { QuoteService } from "@core/quoteService";
import { Quote } from "@domain/Quote";
import { Result, ResultAsync, err, fromPromise, fromThrowable, ok } from "neverthrow";
import OpenAI, { OpenAIError } from "openai";
import { ChatCompletion } from "openai/resources/chat";

export class OpenAIQuoteService implements QuoteService {
  constructor(private readonly openAiClient: OpenAI) {}

  validateQuote(quote: Quote): Result<Quote, ValidationError> {
    if (quote.chunks.join(" ") !== quote.text) return err(new ValidationError("Quote chunks do not match Quote text"));
    return ok(quote);
  }

  parseChatResponse(response: ChatCompletion): Result<Quote, UnknownError> {
    const safeJsonParse = fromThrowable(
      JSON.parse,
      (error) => new ParseError("Invalid JSON provided by OpenAI", error instanceof Error ? error : undefined),
    );

    const safeQuoteParse = fromThrowable(
      Quote.parse,
      (error) => new ParseError("Invalid Quote provided by OpenAI", error instanceof Error ? error : undefined),
    );

    const quoteJsonString = response.choices[0].message.content ?? "";

    return safeJsonParse(quoteJsonString).andThen(safeQuoteParse);
  }

  generateQuote(): ResultAsync<Quote, ParseError | NetworkError | UnknownError> {
    console.log("Generating quote");

    return fromPromise(
      this.openAiClient.chat.completions.create({
        model: "gpt-4-0314",
        messages: [
          {
            role: "system",
            content:
              'You will respond STRICTLY using the following JSON schema, paying attention to the description of the properties:\n\n---\n\n{"$schema":"http://json-schema.org/draft-07/schema#","type":"object","properties":{"text":{"type":"string","description":"The quote"},"chunks":{"type":"array","items":{"type":"string","description":"The entire quote split into natural chunks. Maximum of 6 words"}}},"required":["text","chunks"]}',
          },
          {
            role: "user",
            content:
              "Create a motivational quote, approximately 50 words long, that is focused on personal growth in the second-person but doesn't mention personal growth directly. Use simple English.",
          },
        ],
      }),
      (error) => {
        if (error instanceof OpenAIError) return new NetworkError("OpenAI API error", error);
        return new UnknownError();
      },
    )
      .andThen(this.parseChatResponse)
      .andThen(this.validateQuote);
  }
}

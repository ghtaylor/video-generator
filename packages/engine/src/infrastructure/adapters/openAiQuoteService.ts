import { NetworkError } from "@core/errors/NetworkError";
import { ParseError } from "@core/errors/ParseError";
import { UnknownError } from "@core/errors/UnknownError";
import { ValidationError } from "@core/errors/ValidationError";
import { QuoteService } from "@core/quoteService";
import { Quote } from "@video-generator/domain/Quote";
import { Result, ResultAsync, err, fromPromise, fromThrowable, ok } from "neverthrow";
import OpenAI, { OpenAIError } from "openai";
import { ChatCompletion } from "openai/resources/chat/completions";
import zodToJsonSchema from "zod-to-json-schema";

export class OpenAIQuoteService implements QuoteService {
  constructor(private readonly openAiClient: OpenAI) {}

  validateQuote(quote: Quote): Result<Quote, ValidationError> {
    if (quote.chunks.join(" ") !== quote.text) return err(new ValidationError("Quote chunks do not match Quote text"));
    return ok(quote);
  }

  parseChatResponse(response: ChatCompletion): Result<Quote, ParseError> {
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

  generateQuote(prompt: string): ResultAsync<Quote, ValidationError | ParseError | NetworkError | UnknownError> {
    return fromPromise(
      this.openAiClient.chat.completions.create({
        model: "gpt-4-0314",
        messages: [
          {
            role: "system",
            content: `You will respond STRICTLY using the following JSON schema, paying attention to the description of the properties:
            
            ---
            
            '${JSON.stringify(zodToJsonSchema(Quote))}'`,
          },
          {
            role: "user",
            content: prompt,
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

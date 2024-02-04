import { NetworkError } from "@core/errors/NetworkError";
import { ParseError } from "@core/errors/ParseError";
import { OpenAIQuoteService } from "@infrastructure/adapters/openAiQuoteService";
import { Quote } from "@video-generator/domain/Quote";
import { mockDeep } from "vitest-mock-extended";
import { err } from "neverthrow";
import OpenAI from "openai";
import { buildChatCompletion } from "../../helpers/openAi";

const openAIClient = mockDeep<OpenAI>();
const openAIQuoteService = new OpenAIQuoteService(openAIClient);

describe("OpenAIQuoteService - Integration Tests", () => {
  const PROMPT = "Example prompt";

  describe("GIVEN the OpenAI Client returns a single message containing a valid JSON string representing a Quote", () => {
    beforeEach(() => {
      openAIClient.chat.completions.create.mockResolvedValue(
        buildChatCompletion('{"title":"Title example","text":"This is an example","chunks":["This is an example"]}'),
      );
    });
    describe("WHEN `generateQuote` is called with a prompt", () => {
      test("THEN it calls `parseChatResponse` with the ChatCompletion", async () => {
        const parseChatResponseSpy = vitest.spyOn(openAIQuoteService, "parseChatResponse");

        await openAIQuoteService.generateQuote(PROMPT);

        expect(parseChatResponseSpy).toHaveBeenCalledWith(
          buildChatCompletion('{"title":"Title example","text":"This is an example","chunks":["This is an example"]}'),
        );
      });

      test("THEN it calls `validateQuote` with the Quote", async () => {
        const validateQuoteSpy = vitest.spyOn(openAIQuoteService, "validateQuote");

        await openAIQuoteService.generateQuote(PROMPT);

        expect(validateQuoteSpy).toHaveBeenCalledWith<[Quote]>({
          title: "Title example",
          text: "This is an example",
          chunks: ["This is an example"],
        });
      });

      test("THEN it returns a Quote", async () => {
        const result = await openAIQuoteService.generateQuote(PROMPT);

        expect(result._unsafeUnwrap()).toEqual<Quote>({
          title: "Title example",
          text: "This is an example",
          chunks: ["This is an example"],
        });
      });
    });
  });

  describe("GIVEN the OpenAI Client returns a single message containing an invalid JSON string", () => {
    beforeEach(() => {
      openAIClient.chat.completions.create.mockResolvedValue(buildChatCompletion("This is not valid JSON"));
    });
    describe("WHEN `generateQuote` is called with a prompt", () => {
      test("THEN it returns a ParseError", async () => {
        const result = await openAIQuoteService.generateQuote(PROMPT);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ParseError);
      });
    });
  });

  describe("GIVEN the OpenAI Client returns a single message containing a valid JSON string that does not represent a Quote", () => {
    beforeEach(() => {
      openAIClient.chat.completions.create.mockResolvedValue(buildChatCompletion('{"not":"a quote"}'));
    });
    describe("WHEN `generateQuote` is called", () => {
      test("THEN it returns a ParseError", async () => {
        const result = await openAIQuoteService.generateQuote(PROMPT);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ParseError);
      });
    });
  });

  describe("GIVEN the OpenAI Client throws an OpenAIError", () => {
    const openAIError = new OpenAI.OpenAIError("OpenAIError");

    beforeEach(() => {
      openAIClient.chat.completions.create.mockRejectedValue(openAIError);
    });

    describe("WHEN `generateQuote` is called with a prompt", () => {
      test("THEN it returns a NetworkError containing the OpenAIError", async () => {
        await expect(openAIQuoteService.generateQuote(PROMPT)).resolves.toEqual(
          err(new NetworkError("OpenAI API error", openAIError)),
        );
      });
    });
  });
});

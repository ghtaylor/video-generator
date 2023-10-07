import { OpenAIQuoteService } from "@infrastructure/adapters/openAIQuoteService";
import { mockDeep } from "jest-mock-extended";
import OpenAI from "openai";
import { buildChatCompletion } from "../../helpers/openAi";
import { err, ok } from "neverthrow";
import { ParseError } from "@core/errors/ParseError";
import { NetworkError } from "@core/errors/NetworkError";

const openAIClient = mockDeep<OpenAI>();
const openAIQuoteService = new OpenAIQuoteService(openAIClient);

describe("OpenAIQuoteService - Integration Tests", () => {
  describe("GIVEN the OpenAI Client returns a single message containing a valid JSON string representing a Quote", () => {
    beforeEach(() => {
      openAIClient.chat.completions.create.mockResolvedValue(
        buildChatCompletion('{"text":"This is an example","chunks":["This is an example"]}'),
      );
    });
    describe("WHEN `generateQuote` is called", () => {
      test("THEN it calls `parseChatResponse` with the ChatCompletion", async () => {
        const parseChatResponseSpy = jest.spyOn(openAIQuoteService, "parseChatResponse");

        await openAIQuoteService.generateQuote();

        expect(parseChatResponseSpy).toHaveBeenCalledWith(
          buildChatCompletion('{"text":"This is an example","chunks":["This is an example"]}'),
        );
      });

      test("THEN it calls `validateQuote` with the Quote", async () => {
        const validateQuoteSpy = jest.spyOn(openAIQuoteService, "validateQuote");

        await openAIQuoteService.generateQuote();

        expect(validateQuoteSpy).toHaveBeenCalledWith({
          text: "This is an example",
          chunks: ["This is an example"],
        });
      });

      test("THEN it returns a Quote", async () => {
        await expect(openAIQuoteService.generateQuote()).resolves.toEqual(
          ok({
            text: "This is an example",
            chunks: ["This is an example"],
          }),
        );
      });
    });
  });

  describe("GIVEN the OpenAI Client returns a single message containing an invalid JSON string", () => {
    beforeEach(() => {
      openAIClient.chat.completions.create.mockResolvedValue(buildChatCompletion("This is not valid JSON"));
    });
    describe("WHEN `generateQuote` is called", () => {
      test("THEN it returns a ParseError", async () => {
        const result = await openAIQuoteService.generateQuote();
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
        const result = await openAIQuoteService.generateQuote();
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ParseError);
      });
    });
  });

  describe("GIVEN the OpenAI Client throws an OpenAIError", () => {
    const openAIError = new OpenAI.OpenAIError("OpenAIError");

    beforeEach(() => {
      openAIClient.chat.completions.create.mockRejectedValue(openAIError);
    });

    describe("WHEN `generateQuote` is called", () => {
      test("THEN it returns a NetworkError containing the OpenAIError", async () => {
        await expect(openAIQuoteService.generateQuote()).resolves.toEqual(
          err(new NetworkError("OpenAI API error", openAIError)),
        );
      });
    });
  });
});

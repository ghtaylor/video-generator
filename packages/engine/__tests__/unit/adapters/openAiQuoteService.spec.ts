import { ParseError } from "@core/errors/ParseError";
import { OpenAIQuoteService } from "@infrastructure/adapters/openAiQuoteService";
import { Quote } from "@video-generator/domain/Quote";
import { QuoteChunksInvalidError } from "@video-generator/domain/errors/Quote";
import { ok } from "neverthrow";
import OpenAI from "openai";
import { ChatCompletion } from "openai/resources/chat/completions";
import { mock } from "vitest-mock-extended";
import { buildChatCompletion } from "../../helpers/openAi";

const openAiClient = mock<OpenAI>();
const openAiQuoteService = new OpenAIQuoteService(openAiClient);

describe("OpenAiQuoteService - Unit Tests", () => {
  describe("`validateQuote`", () => {
    describe.each<Quote>([
      {
        title: "A Title",
        text: "This is an example, a good one.",
        chunks: ["This is an example,", "a good one."],
      },

      {
        title: "A Title",
        text: "This is another example, it's a bit longer, don't you think?",
        chunks: ["This is another example,", "it's a bit longer,", "don't you think?"],
      },
    ])("GIVEN a Quote that is valid (chunks match text)", (validQuote) => {
      describe("WHEN `validateQuote` is called", () => {
        test("THEN it returns the Quote", () => {
          expect(openAiQuoteService.validateQuote(validQuote)).toEqual(ok(validQuote));
        });
      });
    });

    describe.each<Quote>([
      {
        title: "A Title",
        text: "This is a bad example, because the last chunk doesn't end with a full stop.",
        chunks: ["This is a bad example,", "because the last chunk", "doesn't end with a full stop"],
      },
      {
        title: "A Title",
        text: "This is a bad example.",
        chunks: ["BAD"],
      },
      {
        title: "A Title",
        text: "This is a bad example.",
        chunks: [],
      },
    ])("GIVEN a Quote that is invalid (chunks do not match text)", (invalidQuote) => {
      describe("WHEN `validateQuote` is called", () => {
        test("THEN it returns a QuoteChunksInvalidError", () => {
          const result = openAiQuoteService.validateQuote(invalidQuote);
          expect(result._unsafeUnwrapErr()).toBeInstanceOf(QuoteChunksInvalidError);
        });
      });
    });
  });

  describe("`parseChatResponse`", () => {
    describe("GIVEN an OpenAI ChatCompletion containing a valid JSON string representing a Quote", () => {
      const response: ChatCompletion = buildChatCompletion(
        '{"title":"A title","text":"This is an example","chunks":["This is an example"]}',
      );
      describe("WHEN `parseChatResponse` is called", () => {
        test("THEN it returns the expected Quote", () => {
          const result = openAiQuoteService.parseChatResponse(response);
          expect(result._unsafeUnwrap()).toEqual<Quote>({
            title: "A title",
            text: "This is an example",
            chunks: ["This is an example"],
          });
        });
      });
    });

    describe("GIVEN an OpenAI ChatCompletion containing an invalid JSON string", () => {
      const response: ChatCompletion = buildChatCompletion("This is an example of invalid JSON");

      describe("WHEN `parseChatResponse` is called", () => {
        test("THEN it returns a ParseError", () => {
          const result = openAiQuoteService.parseChatResponse(response);
          expect(result._unsafeUnwrapErr()).toBeInstanceOf(ParseError);
        });
      });
    });

    describe("GIVEN an OpenAI ChatCompletion containing a valid JSON string that does not represent a Quote", () => {
      const response = buildChatCompletion(
        '{"someOtherPropertyName":"This is an example","chunks":["This is an example"]}',
      );

      describe("WHEN `parseChatResponse` is called", () => {
        test("THEN it returns a ParseError", () => {
          const result = openAiQuoteService.parseChatResponse(response);
          expect(result._unsafeUnwrapErr()).toBeInstanceOf(ParseError);
        });
      });
    });
  });
});

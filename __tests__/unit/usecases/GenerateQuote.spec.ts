import { NetworkError } from "@core/errors/NetworkError";
import { UnknownError } from "@core/errors/UnknownError";
import { QuoteService } from "@core/quoteService";
import { GenerateQuoteUseCase } from "@core/usecases/GenerateQuote";
import { Quote } from "@domain/Quote";
import { QuoteChunksInvalidError } from "@domain/errors/Quote";
import { mock } from "jest-mock-extended";
import { Result } from "true-myth";

const quoteService = mock<QuoteService>();

const generateQuoteUseCase = new GenerateQuoteUseCase(quoteService);

describe("GenerateQuote Use Case", () => {
  describe("Given the QuoteService generates a Quote with chunks that do not match the quote text", () => {
    const quote: Quote = {
      text: "This is an example, a bad one.",
      chunks: ["This is", "bad example."],
    };

    beforeEach(() => {
      quoteService.generateQuote.mockResolvedValue(Result.ok(quote));
    });

    describe("When the GenerateQuote Use Case is executed", () => {
      test("Then the Use Case should return a QuoteChunksInvalidError", async () => {
        await expect(generateQuoteUseCase.execute()).resolves.toEqual(Result.err(new QuoteChunksInvalidError()));
      });
    });
  });

  describe("Given the QuoteService generates a Quote with chunks that match the quote text", () => {
    const quote: Quote = {
      text: "This is an example, a good one.",
      chunks: ["This is an example,", "a good one."],
    };

    beforeEach(() => {
      quoteService.generateQuote.mockResolvedValue(Result.ok(quote));
    });

    describe("When the GenerateQuote Use Case is executed", () => {
      test("Then the Use Case should return the quote", async () => {
        await expect(generateQuoteUseCase.execute()).resolves.toEqual(Result.ok(quote));
      });
    });
  });

  describe("Given the QuoteService fails to generate a Quote due to a network error", () => {
    beforeEach(() => {
      quoteService.generateQuote.mockResolvedValue(Result.err(new NetworkError()));
    });

    describe("When the GenerateQuote Use Case is executed", () => {
      test("Then the Use Case should return the network error", async () => {
        await expect(generateQuoteUseCase.execute()).resolves.toEqual(Result.err(new NetworkError()));
      });
    });
  });

  describe("Given the QuoteService fails to generate a Quote due to an unknown error", () => {
    beforeEach(() => {
      quoteService.generateQuote.mockResolvedValue(Result.err(new UnknownError()));
    });

    describe("When the GenerateQuote Use Case is executed", () => {
      test("Then the Use Case should return the unknown error", async () => {
        await expect(generateQuoteUseCase.execute()).resolves.toEqual(Result.err(new UnknownError()));
      });
    });
  });
});

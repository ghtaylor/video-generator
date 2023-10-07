import { NetworkError } from "@core/errors/NetworkError";
import { UnknownError } from "@core/errors/UnknownError";
import { Queue } from "@core/queue";
import { QuoteService } from "@core/quoteService";
import { GenerateQuoteUseCase } from "@core/usecases/GenerateQuote";
import { Quote } from "@domain/Quote";
import { QuoteChunksInvalidError } from "@domain/errors/Quote";
import { mock } from "jest-mock-extended";
import { err, errAsync, ok, okAsync } from "neverthrow";

const quoteService = mock<QuoteService>();
const quoteQueue = mock<Queue<Quote>>();

const generateQuoteUseCase = new GenerateQuoteUseCase(quoteService, quoteQueue);

describe("GenerateQuote Use Case - Integration Tests", () => {
  describe("GIVEN the QuoteService generates a valid Quote", () => {
    const validQuote: Quote = {
      text: "This is an example, a good one.",
      chunks: ["This is an example,", "a good one."],
    };

    beforeEach(() => {
      quoteService.generateQuote.mockReturnValue(okAsync(validQuote));
    });

    describe("AND the QuoteQueue successfully enqueues the Quote", () => {
      beforeEach(() => {
        quoteQueue.enqueue.mockReturnValue(okAsync(validQuote));
      });

      describe("WHEN the GenerateQuote Use Case is executed", () => {
        test("THEN the QuoteService should be called to generate a Quote", async () => {
          await generateQuoteUseCase.execute();
          expect(quoteService.generateQuote).toHaveBeenCalled();
        });

        test("THEN the Quote should be added to the QuoteQueue", async () => {
          await generateQuoteUseCase.execute();
          expect(quoteQueue.enqueue).toHaveBeenCalledWith(validQuote);
        });

        test("Then the execution should return the Quote, meaning success", async () => {
          await expect(generateQuoteUseCase.execute()).resolves.toEqual(ok(validQuote));
        });
      });
    });

    describe("AND the QuoteQueue fails to enqueue the Quote due to a NetworkError", () => {
      const networkError = new NetworkError("Network error");

      beforeEach(() => {
        quoteQueue.enqueue.mockReturnValue(errAsync(networkError));
      });

      describe("WHEN the GenerateQuote Use Case is executed", () => {
        test("THEN the execution should return a NetworkError", async () => {
          await expect(generateQuoteUseCase.execute()).resolves.toEqual(err(networkError));
        });
      });
    });

    describe("AND the QuoteQueue fails to enqueue the Quote due to an UnknownError", () => {
      const unknownError = new UnknownError("Unknown error");

      beforeEach(() => {
        quoteQueue.enqueue.mockReturnValue(errAsync(unknownError));
      });

      describe("WHEN the GenerateQuote Use Case is executed", () => {
        test("THEN the execution should return an UnknownError", async () => {
          await expect(generateQuoteUseCase.execute()).resolves.toEqual(err(unknownError));
        });
      });
    });
  });

  describe("GIVEN the QuoteService generates an invalid Quote", () => {
    const invalidQuote: Quote = {
      text: "This is an example, a good one.",
      chunks: ["This is an example,", "a bad one."],
    };

    beforeEach(() => {
      quoteService.generateQuote.mockReturnValue(okAsync(invalidQuote));
    });

    describe("WHEN the GenerateQuote Use Case is executed", () => {
      test("THEN the QuoteQueue should not be called", async () => {
        await generateQuoteUseCase.execute();
        expect(quoteQueue.enqueue).not.toHaveBeenCalled();
      });

      test("THEN the execution should return a QuoteChunksInvalidError", async () => {
        await expect(generateQuoteUseCase.execute()).resolves.toEqual(err(new QuoteChunksInvalidError()));
      });
    });
  });

  describe("GIVEN the QuoteService fails to generate a Quote due to a NetworkError", () => {
    const networkError = new NetworkError("Network error");

    beforeEach(() => {
      quoteService.generateQuote.mockReturnValue(errAsync(networkError));
    });

    describe("WHEN the GenerateQuote Use Case is executed", () => {
      test("THEN the QuoteQueue should not be called", async () => {
        await generateQuoteUseCase.execute();
        expect(quoteQueue.enqueue).not.toHaveBeenCalled();
      });

      test("THEN the execution should return a NetworkError", async () => {
        await expect(generateQuoteUseCase.execute()).resolves.toEqual(err(networkError));
      });
    });
  });

  describe("GIVEN the QuoteService fails to generate a Quote due to an UnknownError", () => {
    const unknownError = new UnknownError("Unknown error");

    beforeEach(() => {
      quoteService.generateQuote.mockReturnValue(errAsync(unknownError));
    });

    describe("WHEN the GenerateQuote Use Case is executed", () => {
      test("THEN the QuoteQueue should not be called", async () => {
        await generateQuoteUseCase.execute();
        expect(quoteQueue.enqueue).not.toHaveBeenCalled();
      });

      test("THEN the execution should return an UnknownError", async () => {
        await expect(generateQuoteUseCase.execute()).resolves.toEqual(err(unknownError));
      });
    });
  });
});

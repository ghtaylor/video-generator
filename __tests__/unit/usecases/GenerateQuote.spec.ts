import { NetworkError } from "@core/errors/NetworkError";
import { UnknownError } from "@core/errors/UnknownError";
import { Queue } from "@core/queue";
import { QuoteService } from "@core/quoteService";
import { GenerateQuoteUseCase } from "@core/usecases/GenerateQuote";
import { Quote } from "@domain/Quote";
import { QuoteChunksInvalidError } from "@domain/errors/Quote";
import { mock } from "jest-mock-extended";
import { Result, Unit } from "true-myth";

const quoteService = mock<QuoteService>();
const quoteQueue = mock<Queue<Quote>>();

const generateQuoteUseCase = new GenerateQuoteUseCase(quoteService, quoteQueue);

describe("GenerateQuote Use Case", () => {
  describe("WHEN the GenerateQuote Use Case is executed", () => {
    test("THEN the QuoteService should be called to generate a Quote", async () => {
      generateQuoteUseCase.execute().catch(() => {});
      expect(quoteService.generateQuote).toHaveBeenCalled();
    });

    describe("AND the QuoteService generates a valid Quote, with chunks that match the quote text", () => {
      const validQuote: Quote = {
        text: "This is an example, a good one.",
        chunks: ["This is an example,", "a good one."],
      };

      beforeEach(() => {
        quoteService.generateQuote.mockResolvedValue(Result.ok(validQuote));
      });

      test("THEN the Quote should be added to the QuoteQueue", async () => {
        await generateQuoteUseCase.execute();
        expect(quoteQueue.enqueue).toHaveBeenCalledWith(validQuote);
      });

      describe("AND the QuoteQueue successfully enqueues the Quote", () => {
        beforeEach(() => {
          quoteQueue.enqueue.mockResolvedValue(Result.ok(Unit));
        });

        test("Then the execution should return a Unit, meaning success", async () => {
          await expect(generateQuoteUseCase.execute()).resolves.toEqual(Result.ok(Unit));
        });
        test("Then the quote should be added to the QuoteQueue", async () => {
          await generateQuoteUseCase.execute();
          expect(quoteQueue.enqueue).toHaveBeenCalledWith(validQuote);
        });
      });

      describe("AND the QuoteQueue fails to enqueue the Quote due to a network error", () => {
        beforeEach(() => {
          quoteQueue.enqueue.mockResolvedValue(Result.err(new NetworkError()));
        });

        test("THEN the execution should return a NetworkError", async () => {
          await expect(generateQuoteUseCase.execute()).resolves.toEqual(Result.err(new NetworkError()));
        });
      });

      describe("AND the QuoteQueue fails to enqueue the Quote due to an unknown error", () => {
        beforeEach(() => {
          quoteQueue.enqueue.mockResolvedValue(Result.err(new UnknownError()));
        });

        test("THEN the execution should return an UnknownError", async () => {
          await expect(generateQuoteUseCase.execute()).resolves.toEqual(Result.err(new UnknownError()));
        });
      });
    });

    describe("AND the QuoteService generates an invalid Quote, with chunks that do not match the quote text", () => {
      const invalidQuote: Quote = {
        text: "This is an example, a good one.",
        chunks: ["This is an example,", "a bad one."],
      };

      beforeEach(() => {
        quoteService.generateQuote.mockResolvedValue(Result.ok(invalidQuote));
      });

      test("THEN the execution should return a QuoteChunksInvalidError", async () => {
        console.log(JSON.stringify(await generateQuoteUseCase.execute(), null, 2));
        await expect(generateQuoteUseCase.execute()).resolves.toEqual(Result.err(new QuoteChunksInvalidError()));
      });
    });

    describe("AND the QuoteService fails to generate a Quote due to a network error", () => {
      beforeEach(() => {
        quoteService.generateQuote.mockResolvedValue(Result.err(new NetworkError()));
      });

      test("THEN the execution should return a NetworkError", async () => {
        await expect(generateQuoteUseCase.execute()).resolves.toEqual(Result.err(new NetworkError()));
      });
    });

    describe("AND the QuoteService fails to generate a Quote due to an unknown error", () => {
      beforeEach(() => {
        quoteService.generateQuote.mockResolvedValue(Result.err(new UnknownError()));
      });

      test("THEN the execution should return an UnknownError", async () => {
        await expect(generateQuoteUseCase.execute()).resolves.toEqual(Result.err(new UnknownError()));
      });
    });
  });
});

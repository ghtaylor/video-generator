import { NetworkError } from "@core/errors/NetworkError";
import { ParseError } from "@core/errors/ParseError";
import { UnknownError } from "@core/errors/UnknownError";
import { ValidationError } from "@core/errors/ValidationError";
import { Queue } from "@core/queue";
import { QuoteService } from "@core/quoteService";
import { GenerateQuoteUseCase } from "@core/usecases/GenerateQuote";
import { Quote } from "@domain/Quote";
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
          const result = await generateQuoteUseCase.execute();
          expect(result._unsafeUnwrapErr()).toBeInstanceOf(NetworkError);
        });
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
        const result = await generateQuoteUseCase.execute();
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(NetworkError);
      });
    });
  });

  describe("GIVEN the QuoteService fails to generate a Quote due to an UnknownError", () => {
    const unknownError = new UnknownError();

    beforeEach(() => {
      quoteService.generateQuote.mockReturnValue(errAsync(unknownError));
    });

    describe("WHEN the GenerateQuote Use Case is executed", () => {
      test("THEN the QuoteQueue should not be called", async () => {
        await generateQuoteUseCase.execute();
        expect(quoteQueue.enqueue).not.toHaveBeenCalled();
      });

      test("THEN the execution should return an UnknownError", async () => {
        const result = await generateQuoteUseCase.execute();
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(UnknownError);
      });
    });
  });

  describe("GIVEN the QuoteService fails to generate a Quote due to a ParseError", () => {
    const parseError = new ParseError("Parse error");

    beforeEach(() => {
      quoteService.generateQuote.mockReturnValue(errAsync(parseError));
    });

    describe("WHEN the GenerateQuote Use Case is executed", () => {
      test("THEN the QuoteQueue should not be called", async () => {
        await generateQuoteUseCase.execute();
        expect(quoteQueue.enqueue).not.toHaveBeenCalled();
      });

      test("THEN the execution should return an ParseError", async () => {
        const result = await generateQuoteUseCase.execute();
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ParseError);
      });
    });
  });

  describe("GIVEN the QuoteService fails to generate a Quote due to a ValidationError", () => {
    const validationError = new ValidationError("Validation error");

    beforeEach(() => {
      quoteService.generateQuote.mockReturnValue(errAsync(validationError));
    });

    describe("WHEN the GenerateQuote Use Case is executed", () => {
      test("THEN the QuoteQueue should not be called", async () => {
        await generateQuoteUseCase.execute();
        expect(quoteQueue.enqueue).not.toHaveBeenCalled();
      });

      test("THEN the execution should return a ValidationError", async () => {
        const result = await generateQuoteUseCase.execute();
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ValidationError);
      });
    });
  });
});

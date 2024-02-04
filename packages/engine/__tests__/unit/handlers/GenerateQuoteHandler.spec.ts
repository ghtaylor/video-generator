import { ValidationError } from "@core/errors/ValidationError";
import { Logger } from "@core/logger";
import { MessageSender } from "@core/messageSender";
import { QuoteService } from "@core/quoteService";
import { GenerateQuoteUseCase } from "@core/usecases/GenerateQuote";
import { GenerateQuoteHandler } from "@infrastructure/handlers/generateQuote";
import createEvent from "@serverless/event-mocks";
import { Quote } from "@video-generator/domain/Quote";
import { SQSRecord } from "aws-lambda";
import { errAsync, okAsync } from "neverthrow";
import { mock } from "vitest-mock-extended";

describe("GenerateQuote Handler - Unit Tests", () => {
  const quoteService = mock<QuoteService>();
  const onComplete = mock<MessageSender<Quote>>();
  const useCase = new GenerateQuoteUseCase(quoteService, onComplete);

  const logger = mock<Logger>();

  const handler = new GenerateQuoteHandler(useCase, logger);

  describe("WHEN the handler is invoked by an SQSEvent", () => {
    describe("AND the body of the event record is not a valid GenerateQuoteParams", () => {
      const event = createEvent("aws:sqs", {
        Records: [
          {
            body: "invalid body",
          } as SQSRecord,
        ],
      });

      test("THEN the handler shouldn't throw an error, as a retry should not be attempted", async () => {
        await expect(handler.handle(event)).resolves.toBeUndefined();
      });
    });

    describe("AND the body of the event record is a valid GenerateQuoteParams", () => {
      const event = createEvent("aws:sqs", {
        Records: [
          {
            body: `{"prompt":"Example prompt"}`,
          } as SQSRecord,
        ],
      });

      describe("GIVEN the quote service fails due to a ValidationError", () => {
        beforeEach(() => {
          quoteService.generateQuote.mockReturnValue(errAsync(new ValidationError("Validation error")));
        });

        test("THEN the handler should log the error and throw it for retry", async () => {
          await expect(handler.handle(event)).rejects.toThrow(ValidationError);
          expect(logger.error).toHaveBeenCalledWith(
            "Validation error occurred, throwing for retry",
            new ValidationError("Validation error"),
          );
        });
      });

      describe("GIVEN the integrations are successful", () => {
        const quote: Quote = {
          title: "Title example",
          text: "This is an example",
          chunks: ["This is an example"],
        };

        beforeEach(() => {
          quoteService.generateQuote.mockReturnValue(okAsync(quote));
          onComplete.send.mockReturnValue(okAsync(quote));
        });

        test("THEN the quote service should be called with the prompt from the SQSEvent", async () => {
          await handler.handle(event);
          expect(quoteService.generateQuote).toHaveBeenCalledWith("Example prompt");
        });

        test("THEN the handler should terminate successfully", async () => {
          expect(await handler.handle(event)).toBeUndefined();
        });
      });
    });
  });
});

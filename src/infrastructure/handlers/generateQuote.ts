import { SQSClient } from "@aws-sdk/client-sqs";
import { ValidationError } from "@core/errors/ValidationError";
import { Logger } from "@core/logger";
import { QuoteService } from "@core/quoteService";
import { GenerateQuoteUseCase } from "@core/usecases/GenerateQuote";
import { Quote } from "@domain/Quote";
import { OpenAIQuoteService } from "@infrastructure/adapters/openAiQuoteService";
import { PinoLogger } from "@infrastructure/adapters/pinoLogger";
import { SQSQueue } from "@infrastructure/adapters/sqsQueue";
import OpenAI from "openai";
import { Config } from "sst/node/config";
import { Queue } from "sst/node/queue";

export class GenerateQuoteHandler {
  constructor(
    private readonly generateQuoteUseCase: GenerateQuoteUseCase,
    private readonly logger: Logger,
  ) {}

  static build(openAiApiKey: string, quoteQueueUrl: string) {
    const openAIClient = new OpenAI({ apiKey: openAiApiKey });
    const quoteService: QuoteService = new OpenAIQuoteService(openAIClient);

    const sqsClient = new SQSClient({});
    const quoteMessageSender = new SQSQueue<Quote>(sqsClient, quoteQueueUrl);

    const generateQuoteUseCase = new GenerateQuoteUseCase(quoteService, quoteMessageSender);

    const logger = PinoLogger.build();

    return new GenerateQuoteHandler(generateQuoteUseCase, logger);
  }

  async handle() {
    const result = await this.generateQuoteUseCase.execute();

    if (result.isErr() && result.error instanceof ValidationError) {
      this.logger.error("Validation error occurred, throwing for retry", result.error);
      throw result.error;
    }

    this.logger.logResult(result);
  }
}

const handlerInstance = GenerateQuoteHandler.build(Config.OPENAI_API_KEY, Queue.QuoteQueue.queueUrl);

export default handlerInstance.handle.bind(handlerInstance);

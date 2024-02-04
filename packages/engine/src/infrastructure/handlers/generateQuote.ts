import { SQSClient } from "@aws-sdk/client-sqs";
import { ValidationError } from "@core/errors/ValidationError";
import { Logger } from "@core/logger";
import { QuoteService } from "@core/quoteService";
import { GenerateQuoteUseCase } from "@core/usecases/GenerateQuote";
import { GenerateQuoteParams, Quote } from "@video-generator/domain/Quote";
import { OpenAIQuoteService } from "@infrastructure/adapters/openAiQuoteService";
import { PinoLogger } from "@infrastructure/adapters/pinoLogger";
import { SQSQueue } from "@infrastructure/adapters/sqsQueue";
import OpenAI from "openai";
import { Config } from "sst/node/config";
import { Queue } from "sst/node/queue";
import { SQSEvent } from "aws-lambda";
import { parseJsonString } from "@common/parseJsonString";

export class GenerateQuoteHandler {
  constructor(
    private readonly generateQuoteUseCase: GenerateQuoteUseCase,
    private readonly logger: Logger,
  ) {}

  static build(openAiApiKey: string, generateQuoteWithSpeechQueueUrl: string) {
    const openAIClient = new OpenAI({ apiKey: openAiApiKey });
    const quoteService: QuoteService = new OpenAIQuoteService(openAIClient);

    const sqsClient = new SQSClient({});
    const generateQuoteWithSpeechQueue = new SQSQueue<Quote>(sqsClient, generateQuoteWithSpeechQueueUrl);

    const generateQuoteUseCase = new GenerateQuoteUseCase(quoteService, generateQuoteWithSpeechQueue);

    const logger = PinoLogger.build();

    return new GenerateQuoteHandler(generateQuoteUseCase, logger);
  }

  async handle(event: SQSEvent) {
    for (const record of event.Records) {
      const result = await parseJsonString(record.body, GenerateQuoteParams).asyncAndThen(
        this.generateQuoteUseCase.execute.bind(this.generateQuoteUseCase),
      );

      if (result.isErr() && result.error instanceof ValidationError) {
        this.logger.error("Validation error occurred, throwing for retry", result.error);
        throw result.error;
      }

      this.logger.logResult(result);
    }
  }
}

const handlerInstance = GenerateQuoteHandler.build(Config.OPENAI_API_KEY, Queue.GenerateQuoteWithSpeechQueue.queueUrl);

export default handlerInstance.handle.bind(handlerInstance);

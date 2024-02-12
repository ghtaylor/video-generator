import { parseJsonString } from "@common/parseJsonString";
import { ValidationError } from "@core/errors/ValidationError";
import { Logger } from "@core/logger";
import { QuoteService } from "@core/quoteService";
import { GenerateQuoteUseCase } from "@core/usecases/GenerateQuote";
import { OpenAIQuoteService } from "@infrastructure/adapters/openAiQuoteService";
import { PinoLogger } from "@infrastructure/adapters/pinoLogger";
import { GenerateQuoteParams } from "@video-generator/domain/Quote";
import { SQSEvent } from "aws-lambda";
import OpenAI from "openai";
import { Config } from "sst/node/config";

export class GenerateQuoteHandler {
  constructor(
    private readonly generateQuoteUseCase: GenerateQuoteUseCase,
    private readonly logger: Logger,
  ) {}

  static build(openAiApiKey: string) {
    const openAIClient = new OpenAI({ apiKey: openAiApiKey });
    const quoteService: QuoteService = new OpenAIQuoteService(openAIClient);

    const generateQuoteUseCase = new GenerateQuoteUseCase(quoteService);

    const logger = PinoLogger.build();

    return new GenerateQuoteHandler(generateQuoteUseCase, logger);
  }

  async handle(event: SQSEvent) {
    for (const record of event.Records) {
      const result = await parseJsonString(record.body, GenerateQuoteParams).asyncAndThen(({ prompt }) =>
        this.generateQuoteUseCase.execute(prompt),
      );

      if (result.isErr() && result.error instanceof ValidationError) {
        this.logger.error("Validation error occurred, throwing for retry", result.error);
        throw result.error;
      }

      this.logger.logResult(result);
    }
  }
}

const handlerInstance = GenerateQuoteHandler.build(Config.OPENAI_API_KEY);

export default handlerInstance.handle.bind(handlerInstance);

import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { parseJson } from "@common/parseJson";
import { Logger } from "@core/logger";
import { QuoteService } from "@core/quoteService";
import { GenerateQuoteUseCase } from "@core/usecases/GenerateQuote";
import { EventBridgeProgressReporter } from "@infrastructure/adapters/eventBridgeProgressReporter";
import { OpenAIQuoteService } from "@infrastructure/adapters/openAiQuoteService";
import { PinoLogger } from "@infrastructure/adapters/pinoLogger";
import { GenerateQuoteParams, Quote } from "@video-generator/domain/Quote";
import OpenAI from "openai";
import { Config } from "sst/node/config";
import { EventBus } from "sst/node/event-bus";

export class GenerateQuoteHandler {
  constructor(
    private readonly generateQuoteUseCase: GenerateQuoteUseCase,
    private readonly logger: Logger,
  ) {}

  static build(openAiApiKey: string, eventBusName: string) {
    const logger = PinoLogger.build();

    const openAIClient = new OpenAI({ apiKey: openAiApiKey });
    const quoteService: QuoteService = new OpenAIQuoteService(openAIClient);

    const eventBridgeClient = new EventBridgeClient({});
    const progressReporter = new EventBridgeProgressReporter(eventBridgeClient, eventBusName, logger);

    const generateQuoteUseCase = new GenerateQuoteUseCase(quoteService, progressReporter);

    return new GenerateQuoteHandler(generateQuoteUseCase, logger);
  }

  async handle(payload: unknown): Promise<Quote> {
    return parseJson(payload, GenerateQuoteParams)
      .asyncAndThen(({ prompt }) => this.generateQuoteUseCase.execute(prompt))
      .match(
        (quote) => {
          this.logger.info("Quote generated", quote);
          return quote;
        },
        (error) => {
          this.logger.error("Error generating quote", error);
          throw error;
        },
      );
  }
}

const handlerInstance = GenerateQuoteHandler.build(Config.OPENAI_API_KEY, EventBus.EventBus.eventBusName);

export default handlerInstance.handle.bind(handlerInstance);

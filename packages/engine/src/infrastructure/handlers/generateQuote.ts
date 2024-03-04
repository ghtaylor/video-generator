import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { parseJson } from "@common/parseJson";
import { Logger } from "@core/logger";
import { QuoteService } from "@core/quoteService";
import { GenerateQuoteUseCase } from "@core/usecases/GenerateQuote";
import { EventBridgeEventSender } from "@infrastructure/adapters/eventBridgeEventSender";
import { OpenAIQuoteService } from "@infrastructure/adapters/openAiQuoteService";
import { PinoLogger } from "@infrastructure/adapters/pinoLogger";
import { BaseSFNPayload } from "@infrastructure/events/sfnPayload";
import { GenerateQuoteParams, Quote } from "@video-generator/domain/Quote";
import OpenAI from "openai";
import { Config } from "sst/node/config";
import { EventBus } from "sst/node/event-bus";

const Payload = BaseSFNPayload.extend({ quoteParams: GenerateQuoteParams });

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
    const executionManager = new EventBridgeEventSender(eventBridgeClient, eventBusName);

    const generateQuoteUseCase = new GenerateQuoteUseCase(quoteService, executionManager);

    return new GenerateQuoteHandler(generateQuoteUseCase, logger);
  }

  async handle(payload: unknown): Promise<Quote> {
    return parseJson(payload, Payload)
      .asyncAndThen(({ quoteParams, id }) => this.generateQuoteUseCase.execute(id, quoteParams))
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

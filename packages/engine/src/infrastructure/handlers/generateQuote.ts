import { parseJson } from "@common/parseJson";
import { Logger } from "@core/logger";
import { QuoteService } from "@core/quoteService";
import { GenerateQuoteUseCase } from "@core/usecases/GenerateQuote";
import { OpenAIQuoteService } from "@infrastructure/adapters/openAiQuoteService";
import { PinoLogger } from "@infrastructure/adapters/pinoLogger";
import { GenerateQuoteParams, Quote } from "@video-generator/domain/Quote";
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

const handlerInstance = GenerateQuoteHandler.build(Config.OPENAI_API_KEY);

export default handlerInstance.handle.bind(handlerInstance);

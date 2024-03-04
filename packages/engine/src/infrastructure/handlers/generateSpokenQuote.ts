import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { S3Client } from "@aws-sdk/client-s3";
import { parseJson, parseJsonString } from "@common/parseJson";
import { ParseError } from "@core/errors/ParseError";
import { Logger } from "@core/logger";
import { GenerateSpokenQuoteUseCase } from "@core/usecases/GenerateSpokenQuote";
import { ElevenLabsConfig } from "@infrastructure/adapters/elevenLabs/config";
import { ElevenLabsClient } from "@infrastructure/adapters/elevenLabs/elevenLabsClient";
import { ElevenLabsSpeechService } from "@infrastructure/adapters/elevenLabs/elevenLabsSpeechService";
import { EventBridgeEventSender } from "@infrastructure/adapters/eventBridgeEventSender";
import { PinoLogger } from "@infrastructure/adapters/pinoLogger";
import { S3FileStore } from "@infrastructure/adapters/s3FileStore";
import { BaseSFNPayload } from "@infrastructure/events/sfnPayload";
import { Quote, SpokenQuote } from "@video-generator/domain/Quote";
import { Result } from "neverthrow";
import { Bucket } from "sst/node/bucket";
import { Config } from "sst/node/config";
import { EventBus } from "sst/node/event-bus";

const Payload = BaseSFNPayload.extend({ quote: Quote });

export class GenerateSpokenQuoteHandler {
  constructor(
    private readonly generateSpokenQuoteUseCase: GenerateSpokenQuoteUseCase,
    private readonly logger: Logger,
  ) {}

  static build(
    bucketName: string,
    eventBusName: string,
    elevenLabsConfig: string,
    logger: Logger = PinoLogger.build(),
  ): Result<GenerateSpokenQuoteHandler, ParseError> {
    return parseJsonString(elevenLabsConfig, ElevenLabsConfig).map((elevenLabsConfig) => {
      const elevenLabsClient = new ElevenLabsClient(elevenLabsConfig);

      const speechService = new ElevenLabsSpeechService(elevenLabsClient);

      const s3Client = new S3Client({});
      const s3FileStore = new S3FileStore(s3Client, bucketName);

      const eventBridgeClient = new EventBridgeClient({});
      const executionManager = new EventBridgeEventSender(eventBridgeClient, eventBusName);

      const generateSpokenQuoteUseCase = new GenerateSpokenQuoteUseCase(speechService, s3FileStore, executionManager);

      return new GenerateSpokenQuoteHandler(generateSpokenQuoteUseCase, logger);
    });
  }

  async handle(payload: unknown): Promise<SpokenQuote> {
    return parseJson(payload, Payload)
      .asyncAndThen(({ quote, executionId }) => this.generateSpokenQuoteUseCase.execute(executionId, quote))
      .match(
        (spokenQuote) => {
          this.logger.info("Spoken quote generated", spokenQuote);
          return spokenQuote;
        },
        (error) => {
          this.logger.error("Error generating spoken quote", error);
          throw error;
        },
      );
  }
}

export default async (payload: unknown): Promise<SpokenQuote> => {
  const logger = PinoLogger.build();

  return GenerateSpokenQuoteHandler.build(
    Bucket.Bucket.bucketName,
    EventBus.EventBus.eventBusName,
    Config.ELEVEN_LABS_CONFIG,
    logger,
  ).match(
    async (handlerInstance) => handlerInstance.handle(payload),
    async (error) => {
      logger.error("Failed to create handler", error);
      throw error;
    },
  );
};

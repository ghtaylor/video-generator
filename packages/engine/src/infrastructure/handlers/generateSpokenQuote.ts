import { S3Client } from "@aws-sdk/client-s3";
import { parseJson, parseJsonString } from "@common/parseJson";
import { ParseError } from "@core/errors/ParseError";
import { Logger } from "@core/logger";
import { GenerateSpokenQuoteUseCase } from "@core/usecases/GenerateSpokenQuote";
import { ElevenLabsConfig } from "@infrastructure/adapters/elevenLabs/config";
import { ElevenLabsClient } from "@infrastructure/adapters/elevenLabs/elevenLabsClient";
import { ElevenLabsSpeechService } from "@infrastructure/adapters/elevenLabs/elevenLabsSpeechService";
import { PinoLogger } from "@infrastructure/adapters/pinoLogger";
import { S3FileStore } from "@infrastructure/adapters/s3FileStore";
import { Quote, SpokenQuote } from "@video-generator/domain/Quote";
import { Result } from "neverthrow";
import { Bucket } from "sst/node/bucket";
import { Config } from "sst/node/config";

export class GenerateSpokenQuoteHandler {
  constructor(
    private readonly generateSpokenQuoteUseCase: GenerateSpokenQuoteUseCase,
    private readonly logger: Logger,
  ) {}

  static build(
    bucketName: string,
    elevenLabsConfig: string,
    logger: Logger = PinoLogger.build(),
  ): Result<GenerateSpokenQuoteHandler, ParseError> {
    return parseJsonString(elevenLabsConfig, ElevenLabsConfig).map((elevenLabsConfig) => {
      const elevenLabsClient = new ElevenLabsClient(elevenLabsConfig);

      const speechService = new ElevenLabsSpeechService(elevenLabsClient);

      const s3Client = new S3Client({});
      const s3FileStore = new S3FileStore(s3Client, bucketName);

      const generateSpokenQuoteUseCase = new GenerateSpokenQuoteUseCase(speechService, s3FileStore);

      return new GenerateSpokenQuoteHandler(generateSpokenQuoteUseCase, logger);
    });
  }

  async handle(payload: unknown): Promise<SpokenQuote> {
    return parseJson(payload, Quote)
      .asyncAndThen(this.generateSpokenQuoteUseCase.execute.bind(this.generateSpokenQuoteUseCase))
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

  return GenerateSpokenQuoteHandler.build(Bucket.Bucket.bucketName, Config.ELEVEN_LABS_CONFIG, logger).match(
    async (handlerInstance) => handlerInstance.handle(payload),
    async (error) => {
      logger.error("Failed to create handler", error);
      throw error;
    },
  );
};

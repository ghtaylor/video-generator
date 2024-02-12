import { S3Client } from "@aws-sdk/client-s3";
import { parseJsonString } from "@common/parseJsonString";
import { ParseError } from "@core/errors/ParseError";
import { Logger } from "@core/logger";
import { GenerateSpokenQuoteUseCase } from "@core/usecases/GenerateSpokenQuote";
import { ElevenLabsConfig } from "@infrastructure/adapters/elevenLabs/config";
import { ElevenLabsClient } from "@infrastructure/adapters/elevenLabs/elevenLabsClient";
import { ElevenLabsSpeechService } from "@infrastructure/adapters/elevenLabs/elevenLabsSpeechService";
import { PinoLogger } from "@infrastructure/adapters/pinoLogger";
import { S3FileStore } from "@infrastructure/adapters/s3FileStore";
import { Quote } from "@video-generator/domain/Quote";
import { SQSEvent } from "aws-lambda";
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

  async handle(event: SQSEvent) {
    for (const record of event.Records) {
      const result = await parseJsonString(record.body, Quote).asyncAndThen(
        this.generateSpokenQuoteUseCase.execute.bind(this.generateSpokenQuoteUseCase),
      );

      this.logger.logResult(result);
    }
  }
}

export default async (event: SQSEvent): Promise<void> => {
  const logger = PinoLogger.build();

  return GenerateSpokenQuoteHandler.build(Bucket.Bucket.bucketName, Config.ELEVEN_LABS_CONFIG, logger).match(
    async (handlerInstance) => {
      return handlerInstance.handle(event);
    },
    async (error) => {
      logger.error("Failed to create handler", error);
    },
  );
};

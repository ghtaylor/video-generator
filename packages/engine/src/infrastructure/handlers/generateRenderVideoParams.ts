import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";
import { parseJsonString } from "@common/parseJsonString";
import { ParseError } from "@core/errors/ParseError";
import { Logger } from "@core/logger";
import { GenerateRenderVideoParamsUseCase } from "@core/usecases/GenerateRenderVideoParams";
import { PinoLogger } from "@infrastructure/adapters/pinoLogger";
import { S3FileStore } from "@infrastructure/adapters/s3FileStore";
import { SQSQueue } from "@infrastructure/adapters/sqsQueue";
import { SpokenQuote } from "@video-generator/domain/Quote";
import { RenderVideoParams, VideoConfig } from "@video-generator/domain/Video";
import { SQSEvent } from "aws-lambda";
import { Result } from "neverthrow";
import { Bucket } from "sst/node/bucket";
import { Config } from "sst/node/config";
import { Queue } from "sst/node/queue";

export class GenerateRenderVideoParamsHandler {
  constructor(
    private readonly useCase: GenerateRenderVideoParamsUseCase,
    private readonly videoConfig: VideoConfig,
    private readonly logger: Logger,
  ) {}

  static build(
    bucketName: string,
    videoConfig: string,
    renderVideoQueueUrl: string,
    logger: Logger = PinoLogger.build(),
  ): Result<GenerateRenderVideoParamsHandler, ParseError> {
    return parseJsonString(videoConfig, VideoConfig).map((videoConfig) => {
      const s3Client = new S3Client({});
      const s3FileStore = new S3FileStore(s3Client, bucketName);

      const sqsClient = new SQSClient({});
      const renderVideoQueue = new SQSQueue<RenderVideoParams>(sqsClient, renderVideoQueueUrl);

      const useCase = new GenerateRenderVideoParamsUseCase(s3FileStore, renderVideoQueue);

      return new GenerateRenderVideoParamsHandler(useCase, videoConfig, logger);
    });
  }

  async handle(event: SQSEvent) {
    for (const record of event.Records) {
      const result = await parseJsonString(record.body, SpokenQuote).asyncAndThen((spokenQuote) =>
        this.useCase.execute(spokenQuote, this.videoConfig),
      );

      this.logger.logResult(result);
    }
  }
}

export default async (event: SQSEvent): Promise<void> => {
  const logger = PinoLogger.build();

  return GenerateRenderVideoParamsHandler.build(
    Bucket.Bucket.bucketName,
    Config.VIDEO_CONFIG,
    Queue.RenderVideoQueue.queueUrl,
    logger,
  ).match(
    async (handlerInstance) => {
      return handlerInstance.handle(event);
    },
    async (error) => {
      logger.error("Failed to create handler", error);
    },
  );
};

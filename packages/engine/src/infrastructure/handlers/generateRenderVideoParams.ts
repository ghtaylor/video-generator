import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";
import { parseJsonString } from "@common/parseJsonString";
import { Logger } from "@core/logger";
import { GenerateRenderVideoParamsUseCase } from "@core/usecases/GenerateRenderVideoParams";
import { SpokenQuote } from "@video-generator/domain/Quote";
import { RenderVideoParams } from "@video-generator/domain/Video";
import { PinoLogger } from "@infrastructure/adapters/pinoLogger";
import { S3FileStore } from "@infrastructure/adapters/s3FileStore";
import { SQSQueue } from "@infrastructure/adapters/sqsQueue";
import { SQSEvent } from "aws-lambda";
import { Bucket } from "sst/node/bucket";
import { Queue } from "sst/node/queue";

export class GenerateRenderVideoParamsHandler {
  constructor(
    private readonly useCase: GenerateRenderVideoParamsUseCase,
    private readonly logger: Logger,
  ) {}

  static build(bucketName: string, renderVideoQueueUrl: string) {
    const s3Client = new S3Client({});
    const s3FileStore = new S3FileStore(s3Client, bucketName);

    const sqsClient = new SQSClient({});
    const renderVideoQueue = new SQSQueue<RenderVideoParams>(sqsClient, renderVideoQueueUrl);

    const useCase = new GenerateRenderVideoParamsUseCase(s3FileStore, renderVideoQueue);

    const logger = PinoLogger.build();

    return new GenerateRenderVideoParamsHandler(useCase, logger);
  }

  async handle(event: SQSEvent) {
    for (const record of event.Records) {
      const result = await parseJsonString(record.body, SpokenQuote).asyncAndThen((spokenQuote) =>
        this.useCase.execute(spokenQuote, 30, "videos/", "music/"),
      );

      this.logger.logResult(result);
    }
  }
}

const handlerInstance = GenerateRenderVideoParamsHandler.build(
  Bucket.Bucket.bucketName,
  Queue.RenderVideoQueue.queueUrl,
);

export default handlerInstance.handle.bind(handlerInstance);

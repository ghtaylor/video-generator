import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";
import { ValidationError } from "@core/errors/ValidationError";
import { GenerateRenderVideoParamsUseCase } from "@core/usecases/GenerateRenderVideoParams";
import { SpokenQuote } from "@domain/SpokenQuote";
import { RenderVideoParams } from "@domain/Video";
import { S3FileStore } from "@infrastructure/adapters/s3FileStore";
import { SQSQueue } from "@infrastructure/adapters/sqsQueue";
import { SQSEvent } from "aws-lambda";
import { Result, fromThrowable } from "neverthrow";
import { Bucket } from "sst/node/bucket";
import { Queue } from "sst/node/queue";

export class GenerateRenderVideoParamsHandler {
  constructor(private readonly useCase: GenerateRenderVideoParamsUseCase) {}

  parseMessage(message: string): Result<SpokenQuote, ValidationError> {
    return fromThrowable(
      () => SpokenQuote.parse(JSON.parse(message)),
      (error) => new ValidationError("Failed to parse message", error instanceof Error ? error : undefined),
    )();
  }

  static build(bucketName: string, renderVideoQueueUrl: string) {
    const s3Client = new S3Client({});
    const s3FileStore = new S3FileStore(s3Client, bucketName);

    const sqsClient = new SQSClient({});
    const renderVideoMessageSender = new SQSQueue<RenderVideoParams>(sqsClient, renderVideoQueueUrl);

    const useCase = new GenerateRenderVideoParamsUseCase(s3FileStore, renderVideoMessageSender);

    return new GenerateRenderVideoParamsHandler(useCase);
  }

  async handle(event: SQSEvent) {
    for (const record of event.Records) {
      await this.parseMessage(record.body).asyncAndThen((spokenQuote) =>
        this.useCase.execute(spokenQuote, 30, "videos/"),
      );
    }
  }
}

const handlerInstance = GenerateRenderVideoParamsHandler.build(
  Bucket.Bucket.bucketName,
  Queue.RenderVideoQueue.queueUrl,
);

export default handlerInstance.handle.bind(handlerInstance);

import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";
import { ValidationError } from "@core/errors/ValidationError";
import { GenerateVideoOptionsUseCase } from "@core/usecases/GenerateVideoOptions";
import { SpokenQuote } from "@domain/SpokenQuote";
import { VideoOptions } from "@domain/Video";
import { S3FileStore } from "@infrastructure/adapters/s3FileStore";
import { SQSQueue } from "@infrastructure/adapters/sqsQueue";
import { SQSEvent } from "aws-lambda";
import { Result, fromThrowable } from "neverthrow";
import { Bucket } from "sst/node/bucket";
import { Queue } from "sst/node/queue";

export class GenerateVideoOptionsHandler {
  constructor(private readonly useCase: GenerateVideoOptionsUseCase) {}

  parseMessage(message: string): Result<SpokenQuote, ValidationError> {
    return fromThrowable(
      () => SpokenQuote.parse(JSON.parse(message)),
      (error) => new ValidationError("Failed to parse message", error instanceof Error ? error : undefined),
    )();
  }

  static build(bucketName: string, createVideoQueueUrl: string) {
    const s3Client = new S3Client({});
    const s3FileStore = new S3FileStore(s3Client, bucketName);

    const sqsClient = new SQSClient({});
    const createVideoQueue = new SQSQueue<VideoOptions>(sqsClient, createVideoQueueUrl);

    const useCase = new GenerateVideoOptionsUseCase(s3FileStore, createVideoQueue);

    return new GenerateVideoOptionsHandler(useCase);
  }

  async handle(event: SQSEvent) {
    for (const record of event.Records) {
      await this.parseMessage(record.body).asyncAndThen((spokenQuote) =>
        this.useCase.execute(spokenQuote, 30, "videos/"),
      );
    }
  }
}

const handlerInstance = GenerateVideoOptionsHandler.build(Bucket.Bucket.bucketName, Queue.RenderVideoQueue.queueUrl);

export default handlerInstance.handle.bind(handlerInstance);

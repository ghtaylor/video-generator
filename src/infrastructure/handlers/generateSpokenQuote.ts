import { PollyClient } from "@aws-sdk/client-polly";
import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";
import { ValidationError } from "@core/errors/ValidationError";
import { GenerateSpokenQuoteUseCase } from "@core/usecases/GenerateSpokenQuote";
import { Quote } from "@domain/Quote";
import { SpokenQuote } from "@domain/SpokenQuote";
import { PollySpeechService } from "@infrastructure/adapters/pollySpeechService";
import { S3FileStore } from "@infrastructure/adapters/s3FileStore";
import { SQSQueue } from "@infrastructure/adapters/sqsQueue";
import { SQSEvent } from "aws-lambda";
import { Result, fromThrowable } from "neverthrow";
import { Bucket } from "sst/node/bucket";
import { Queue } from "sst/node/queue";

export class GenerateSpokenQuoteHandler {
  constructor(private readonly generateSpokenQuoteUseCase: GenerateSpokenQuoteUseCase) {}

  static build(bucketName: string, spokenQuoteQueueUrl: string) {
    const pollyClient = new PollyClient({});
    const speechService = new PollySpeechService(pollyClient);

    const s3Client = new S3Client({});
    const s3FileStore = new S3FileStore(s3Client, bucketName);

    const sqsClient = new SQSClient({});
    const spokenQuoteMessageSender = new SQSQueue<SpokenQuote>(sqsClient, spokenQuoteQueueUrl);

    const generateSpokenQuoteUseCase = new GenerateSpokenQuoteUseCase(
      speechService,
      s3FileStore,
      spokenQuoteMessageSender,
    );

    return new GenerateSpokenQuoteHandler(generateSpokenQuoteUseCase);
  }

  parseMessage(message: string): Result<Quote, ValidationError> {
    return fromThrowable(
      () => Quote.parse(JSON.parse(message)),
      (error) => new ValidationError("Failed to parse message", error instanceof Error ? error : undefined),
    )();
  }

  async handle(event: SQSEvent) {
    for (const record of event.Records) {
      await this.parseMessage(record.body).asyncAndThen(
        this.generateSpokenQuoteUseCase.execute.bind(this.generateSpokenQuoteUseCase),
      );
    }
  }
}

const handlerInstance = GenerateSpokenQuoteHandler.build(Bucket.Bucket.bucketName, Queue.SpokenQuoteQueue.queueUrl);

export default handlerInstance.handle.bind(handlerInstance);

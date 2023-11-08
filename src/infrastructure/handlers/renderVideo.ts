import { S3Client } from "@aws-sdk/client-s3";
import { SNSClient } from "@aws-sdk/client-sns";
import { ValidationError } from "@core/errors/ValidationError";
import { RenderVideoUseCase } from "@core/usecases/RenderVideo";
import { RenderVideoParams, UploadVideoParams } from "@domain/Video";
import { RemotionVideoRenderer } from "@infrastructure/adapters/remotionVideoRenderer";
import { S3FileStore } from "@infrastructure/adapters/s3FileStore";
import { SNSMessageSender } from "@infrastructure/adapters/snsMessageSender";
import { SQSEvent } from "aws-lambda";
import { Result, fromThrowable, ok } from "neverthrow";
import { Bucket } from "sst/node/bucket";
import { StaticSite } from "sst/node/site";
import { Topic } from "sst/node/topic";

class RenderVideoHandler {
  constructor(private readonly renderVideoUseCase: RenderVideoUseCase) {}

  static build(
    bucketName: string,
    serveUrl: string,
    videoId: string,
    chromiumExecutablePath: string,
    uploadVideoTopicArn: string,
  ): RenderVideoHandler {
    const videoRenderer = new RemotionVideoRenderer(serveUrl, videoId, chromiumExecutablePath);

    const s3Client = new S3Client({});
    const s3FileStore = new S3FileStore(s3Client, bucketName);

    const snsClient = new SNSClient({});
    const uploadVideoMessageSender = new SNSMessageSender<UploadVideoParams>(snsClient, uploadVideoTopicArn);

    const generateVideoUseCase = new RenderVideoUseCase(videoRenderer, s3FileStore, uploadVideoMessageSender);

    return new RenderVideoHandler(generateVideoUseCase);
  }

  private parseMessage(message: string): Result<RenderVideoParams, ValidationError> {
    return fromThrowable(
      () => RenderVideoParams.parse(JSON.parse(message)),
      (error) => new ValidationError("Failed to parse message", error instanceof Error ? error : undefined),
    )();
  }

  private logInput(renderVideoParams: RenderVideoParams): Result<RenderVideoParams, never> {
    return ok(renderVideoParams);
  }

  async handle(event: SQSEvent): Promise<void> {
    for (const record of event.Records) {
      await this.parseMessage(record.body)
        .andThen(this.logInput.bind(this))
        .asyncAndThen(this.renderVideoUseCase.execute.bind(this.renderVideoUseCase));
    }
  }
}

const handlerInstance = RenderVideoHandler.build(
  Bucket.Bucket.bucketName,
  StaticSite.RemotionApp.url,
  "video",
  process.env.CHROMIUM_EXECUTABLE_PATH!,
  Topic.UploadVideoTopic.topicArn,
);

export default handlerInstance.handle.bind(handlerInstance);

import { S3Client } from "@aws-sdk/client-s3";
import { SNSClient } from "@aws-sdk/client-sns";
import { parseJsonString } from "@common/parseJsonString";
import { Logger } from "@core/logger";
import { RenderVideoUseCase } from "@core/usecases/RenderVideo";
import { RenderVideoParams, RenderedVideo } from "@domain/Video";
import { PinoLogger } from "@infrastructure/adapters/pinoLogger";
import { RemotionVideoRenderer } from "@infrastructure/adapters/remotionVideoRenderer";
import { S3FileStore } from "@infrastructure/adapters/s3FileStore";
import { SNSMessageSender } from "@infrastructure/adapters/snsMessageSender";
import { SQSEvent } from "aws-lambda";
import { Bucket } from "sst/node/bucket";
import { StaticSite } from "sst/node/site";
import { Topic } from "sst/node/topic";

class RenderVideoHandler {
  constructor(
    private readonly renderVideoUseCase: RenderVideoUseCase,
    private readonly logger: Logger,
  ) {}

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
    const uploadVideoMessageSender = new SNSMessageSender<RenderedVideo>(snsClient, uploadVideoTopicArn);

    const renderVideoUseCase = new RenderVideoUseCase(videoRenderer, s3FileStore, uploadVideoMessageSender);

    const logger = PinoLogger.build();

    return new RenderVideoHandler(renderVideoUseCase, logger);
  }

  async handle(event: SQSEvent): Promise<void> {
    for (const record of event.Records) {
      const result = await parseJsonString(record.body, RenderVideoParams).asyncAndThen(
        this.renderVideoUseCase.execute.bind(this.renderVideoUseCase),
      );

      this.logger.logResult(result);
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

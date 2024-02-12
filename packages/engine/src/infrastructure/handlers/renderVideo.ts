import { S3Client } from "@aws-sdk/client-s3";
import { parseJsonString } from "@common/parseJsonString";
import { Logger } from "@core/logger";
import { RenderVideoUseCase } from "@core/usecases/RenderVideo";
import { PinoLogger } from "@infrastructure/adapters/pinoLogger";
import { RemotionVideoRenderer } from "@infrastructure/adapters/remotionVideoRenderer";
import { S3FileStore } from "@infrastructure/adapters/s3FileStore";
import { RenderVideoParams } from "@video-generator/domain/Video";
import { SQSEvent } from "aws-lambda";
import { Bucket } from "sst/node/bucket";
import { StaticSite } from "sst/node/site";

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
  ): RenderVideoHandler {
    const videoRenderer = new RemotionVideoRenderer(serveUrl, videoId, chromiumExecutablePath);

    const s3Client = new S3Client({});
    const s3FileStore = new S3FileStore(s3Client, bucketName);

    const renderVideoUseCase = new RenderVideoUseCase(videoRenderer, s3FileStore);

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
  StaticSite.VideoSite.url,
  "video",
  process.env.CHROMIUM_EXECUTABLE_PATH!,
);

export default handlerInstance.handle.bind(handlerInstance);

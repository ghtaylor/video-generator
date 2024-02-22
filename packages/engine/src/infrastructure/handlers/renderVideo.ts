import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { S3Client } from "@aws-sdk/client-s3";
import { parseJson } from "@common/parseJson";
import { Logger } from "@core/logger";
import { RenderVideoUseCase } from "@core/usecases/RenderVideo";
import { EventBridgeProgressReporter } from "@infrastructure/adapters/eventBridgeProgressReporter";
import { PinoLogger } from "@infrastructure/adapters/pinoLogger";
import { RemotionVideoRenderer } from "@infrastructure/adapters/remotionVideoRenderer";
import { S3FileStore } from "@infrastructure/adapters/s3FileStore";
import { BaseSFNPayload } from "@infrastructure/events/sfnPayload";
import { RenderVideoParams, RenderedVideo } from "@video-generator/domain/Video";
import { Bucket } from "sst/node/bucket";
import { EventBus } from "sst/node/event-bus";
import { StaticSite } from "sst/node/site";

const Payload = BaseSFNPayload.extend({ renderVideoParams: RenderVideoParams });

class RenderVideoHandler {
  constructor(
    private readonly renderVideoUseCase: RenderVideoUseCase,
    private readonly logger: Logger,
  ) {}

  static build(
    bucketName: string,
    eventBusName: string,
    serveUrl: string,
    videoId: string,
    chromiumExecutablePath: string,
  ): RenderVideoHandler {
    const videoRenderer = new RemotionVideoRenderer(serveUrl, videoId, chromiumExecutablePath);

    const s3Client = new S3Client({});
    const s3FileStore = new S3FileStore(s3Client, bucketName);

    const eventBridgeClient = new EventBridgeClient({});
    const progressReporter = new EventBridgeProgressReporter(eventBridgeClient, eventBusName);

    const renderVideoUseCase = new RenderVideoUseCase(videoRenderer, s3FileStore, progressReporter);

    const logger = PinoLogger.build();

    return new RenderVideoHandler(renderVideoUseCase, logger);
  }

  async handle(payload: unknown): Promise<RenderedVideo> {
    return parseJson(payload, Payload)
      .asyncAndThen(({ renderVideoParams, executionId }) =>
        this.renderVideoUseCase.execute(executionId, renderVideoParams),
      )
      .match(
        (renderedVideo) => {
          this.logger.info("Video rendered", renderedVideo);
          return renderedVideo;
        },
        (error) => {
          this.logger.error("Error rendering video", error);
          throw error;
        },
      );
  }
}

const handlerInstance = RenderVideoHandler.build(
  Bucket.Bucket.bucketName,
  EventBus.EventBus.eventBusName,
  StaticSite.VideoSite.url,
  "video",
  process.env.CHROMIUM_EXECUTABLE_PATH!,
);

export default handlerInstance.handle.bind(handlerInstance);

import { S3Client } from "@aws-sdk/client-s3";
import { ValidationError } from "@core/errors/ValidationError";
import { RenderVideoUseCase } from "@core/usecases/RenderVideo";
import { VideoOptions } from "@domain/Video";
import { RemotionVideoRenderer } from "@infrastructure/adapters/remotionVideoRenderer";
import { S3FileStore } from "@infrastructure/adapters/s3FileStore";
import { SQSEvent } from "aws-lambda";
import { Result, fromThrowable, ok } from "neverthrow";
import { Bucket } from "sst/node/bucket";
import { StaticSite } from "sst/node/site";

class RenderVideoHandler {
  constructor(private readonly renderVideoUseCase: RenderVideoUseCase) {}

  static build(
    bucketName: string,
    serveUrl: string,
    videoId: string,
    chromiumExecutablePath: string,
  ): RenderVideoHandler {
    const videoRenderer = new RemotionVideoRenderer(serveUrl, videoId, chromiumExecutablePath);

    const s3Client = new S3Client({});
    const s3FileStore = new S3FileStore(s3Client, bucketName);

    const generateVideoUseCase = new RenderVideoUseCase(videoRenderer, s3FileStore);

    return new RenderVideoHandler(generateVideoUseCase);
  }

  private parseMessage(message: string): Result<VideoOptions, ValidationError> {
    return fromThrowable(
      () => VideoOptions.parse(JSON.parse(message)),
      (error) => new ValidationError("Failed to parse message", error instanceof Error ? error : undefined),
    )();
  }

  private logInput(videoOptions: VideoOptions): Result<VideoOptions, never> {
    console.log("Input:", JSON.stringify(videoOptions, null, 2));
    return ok(videoOptions);
  }

  async handle(event: SQSEvent): Promise<void> {
    for (const record of event.Records) {
      const result = await this.parseMessage(record.body)
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
);

export default handlerInstance.handle.bind(handlerInstance);

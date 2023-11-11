import { S3Client } from "@aws-sdk/client-s3";
import { parseJsonString } from "@common/parseJsonString";
import { NotFoundError } from "@core/errors/NotFoundError";
import { ParseError } from "@core/errors/ParseError";
import { Logger } from "@core/logger";
import { UploadVideoUseCase } from "@core/usecases/UploadVideo";
import { VideoUploader } from "@core/videoUploader";
import { UploadVideoParams, UploadVideoPlatform } from "@domain/Video";
import { PinoLogger } from "@infrastructure/adapters/pinoLogger";
import { S3FileStore } from "@infrastructure/adapters/s3FileStore";
import { YoutubeCredentials } from "@infrastructure/adapters/youtubeUploader/credentials";
import { YoutubeUploader } from "@infrastructure/adapters/youtubeUploader/youtubeUploader";
import { SNSMessage } from "@infrastructure/events/snsMessage";
import { SQSEvent, SQSRecord } from "aws-lambda";
import { Result, err, fromThrowable, ok } from "neverthrow";
import { Bucket } from "sst/node/bucket";
import { Config } from "sst/node/config";
import { z } from "zod";

type VideoUploaderCredentials = Record<UploadVideoPlatform, YoutubeCredentials>;

class UploadVideoHandler {
  constructor(
    private readonly uploadVideoUseCase: UploadVideoUseCase,
    private readonly logger: Logger,
  ) {}

  private static videoUploaderFrom(
    eventSourceARN: string,
    uploaderCredentials: VideoUploaderCredentials,
  ): Result<VideoUploader<UploadVideoPlatform>, NotFoundError> {
    if (eventSourceARN.toLowerCase().includes("youtube"))
      return ok(new YoutubeUploader(uploaderCredentials[UploadVideoPlatform.YouTube]));
    return err(new NotFoundError(`No uploader found for event source ARN: ${eventSourceARN}`));
  }

  private static parseUploaderCredentials(youtubeCredentials: string): Result<VideoUploaderCredentials, ParseError> {
    return fromThrowable(
      () => YoutubeCredentials.parse(JSON.parse(youtubeCredentials)),
      (error) => new ParseError("Failed to parse YouTube credentials", error instanceof Error ? error : undefined),
    )().map((youtubeCredentials) => ({
      [UploadVideoPlatform.YouTube]: youtubeCredentials,
    }));
  }

  static build(
    eventSourceARN: string,
    bucketName: string,
    youtubeCredentials: string,
    logger: Logger = PinoLogger.build(),
  ): Result<UploadVideoHandler, ParseError | NotFoundError> {
    return this.parseUploaderCredentials(youtubeCredentials)
      .andThen((uploaderCredentials) => this.videoUploaderFrom(eventSourceARN, uploaderCredentials))
      .map((uploader) => {
        const s3Client = new S3Client({});
        const s3FileStore = new S3FileStore(s3Client, bucketName);

        const useCase = new UploadVideoUseCase(uploader, s3FileStore);

        return new UploadVideoHandler(useCase, logger);
      });
  }

  private parseMessage(message: string): Result<UploadVideoParams, ParseError> {
    return fromThrowable(
      () => {
        const container = z
          .object({
            Message: z.string(),
          })
          .parse(JSON.parse(message));

        return UploadVideoParams.parse(JSON.parse(container.Message));
      },
      (error) => new ParseError("Failed to parse message", error instanceof Error ? error : undefined),
    )();
  }

  async handle(record: SQSRecord): Promise<void> {
    const result = await parseJsonString(record.body, SNSMessage)
      .andThen((snsMessage) => parseJsonString(snsMessage.Message, UploadVideoParams))
      .asyncAndThen(this.uploadVideoUseCase.execute.bind(this.uploadVideoUseCase));

    this.logger.logResult(result);
  }
}

export default async (event: SQSEvent): Promise<void> => {
  const logger = PinoLogger.build();

  for (const record of event.Records) {
    await UploadVideoHandler.build(record.eventSourceARN, Bucket.Bucket.bucketName, Config.YOUTUBE_CREDENTIALS).match(
      async (handlerInstance) => {
        await handlerInstance.handle(record);
      },
      async (error) => {
        logger.error("Failed to create handler", error);
      },
    );
  }
};

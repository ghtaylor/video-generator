import { S3Client } from "@aws-sdk/client-s3";
import { NotFoundError } from "@core/errors/NotFoundError";
import { ParseError } from "@core/errors/ParseError";
import { VideoUploader } from "@core/videoUploader";
import { UploadVideoUseCase } from "@core/usecases/UploadVideo";
import { UploadVideoParams, UploadVideoPlatform } from "@domain/Video";
import { S3FileStore } from "@infrastructure/adapters/s3FileStore";
import { YoutubeCredentials } from "@infrastructure/adapters/youtubeUploader/credentials";
import { YoutubeUploader } from "@infrastructure/adapters/youtubeUploader/youtubeUploader";
import { SQSEvent, SQSRecord } from "aws-lambda";
import { Result, err, fromThrowable, ok } from "neverthrow";
import { Bucket } from "sst/node/bucket";
import { z } from "zod";
import { Config } from "sst/node/config";

type VideoUploaderCredentials = Record<UploadVideoPlatform, YoutubeCredentials>;

class UploadVideoHandler {
  constructor(private readonly uploadVideoUseCase: UploadVideoUseCase) {}

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

  static build(eventSourceARN: string, bucketName: string, youtubeCredentials: string): UploadVideoHandler | null {
    return this.parseUploaderCredentials(youtubeCredentials)
      .andThen((uploaderCredentials) => this.videoUploaderFrom(eventSourceARN, uploaderCredentials))
      .match(
        (uploader) => {
          const s3Client = new S3Client({});
          const s3FileStore = new S3FileStore(s3Client, bucketName);

          const useCase = new UploadVideoUseCase(uploader, s3FileStore);

          return new UploadVideoHandler(useCase);
        },
        (error) => {
          return null;
        },
      );
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
    await this.parseMessage(record.body).asyncAndThen(this.uploadVideoUseCase.execute.bind(this.uploadVideoUseCase));
  }
}

export default async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    const handlerInstance = UploadVideoHandler.build(
      record.eventSourceARN,
      Bucket.Bucket.bucketName,
      Config.YOUTUBE_CREDENTIALS,
    );

    if (!handlerInstance) continue;

    await handlerInstance.handle(record);
  }
};

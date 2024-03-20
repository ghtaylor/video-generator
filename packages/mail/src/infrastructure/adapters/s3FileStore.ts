import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ServiceError } from "@core/errors/ServiceError";
import { FileStore } from "@core/fileStore";
import { FileUrl } from "@video-generator/domain/File";
import { ResultAsync, fromPromise } from "neverthrow";

export class S3FileStore implements FileStore {
  constructor(
    private readonly s3Client: S3Client,
    private readonly bucketName: string,
  ) {}

  getUrl(path: string): ResultAsync<FileUrl, ServiceError> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: path,
    });

    return fromPromise(
      getSignedUrl(this.s3Client, command, {
        expiresIn: 60 * 60,
      }),
      (error) => new ServiceError("Failed to get file url", { originalError: error }),
    );
  }
}

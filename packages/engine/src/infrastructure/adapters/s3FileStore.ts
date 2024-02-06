import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ServiceError } from "@core/errors/ServiceError";
import { FileStore } from "@core/fileStore";
import { FilePath, FileUrl } from "@video-generator/domain/File";
import { ResultAsync, errAsync, fromPromise } from "neverthrow";

export class S3FileStore implements FileStore {
  constructor(
    private readonly s3Client: S3Client,
    private readonly bucketName: string,
  ) {}

  store(path: FilePath, buffer: Buffer): ResultAsync<FilePath, ServiceError> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: path,
      Body: buffer,
    });

    return fromPromise(
      this.s3Client.send(command),
      (error) => new ServiceError("Failed to store file", error instanceof Error ? error : undefined),
    ).map(() => path);
  }

  listFiles(path: FilePath): ResultAsync<FilePath[], ServiceError> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: path,
    });

    return fromPromise(
      this.s3Client.send(command),
      (error) => new ServiceError("Failed to list files", error instanceof Error ? error : undefined),
    ).map((response) => {
      if (response.Contents === undefined) return [];

      return response.Contents.map((object) => object.Key ?? undefined).filter(
        (key): key is string => key !== undefined,
      );
    });
  }

  getUrl(path: string): ResultAsync<FileUrl, ServiceError> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: path,
    });

    return fromPromise(
      getSignedUrl(this.s3Client, command, {
        expiresIn: 60 * 60,
      }),
      (error) => new ServiceError("Failed to get file url", error instanceof Error ? error : undefined),
    );
  }

  getBuffer(path: string): ResultAsync<Buffer, ServiceError> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: path,
    });

    return fromPromise(
      this.s3Client.send(command),
      (error) => new ServiceError("Failed to get file", error instanceof Error ? error : undefined),
    )
      .andThen((response) => {
        if (response.Body === undefined) return errAsync(new ServiceError("Failed to get file"));

        return fromPromise(
          response.Body.transformToByteArray(),
          (err) => new ServiceError("Failed to transform file to byte array", err instanceof Error ? err : undefined),
        );
      })
      .map(Buffer.from);
  }
}

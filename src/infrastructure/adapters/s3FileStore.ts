import { ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NetworkError } from "@core/errors/NetworkError";
import { UnknownError } from "@core/errors/UnknownError";
import { FileLocation, FileStore } from "@core/fileStore";
import { ResultAsync, fromPromise } from "neverthrow";

export class S3FileStore implements FileStore {
  constructor(
    private readonly s3Client: S3Client,
    private readonly bucketName: string,
  ) {}

  store(path: FileLocation, buffer: Buffer): ResultAsync<string, NetworkError | UnknownError> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: path,
      Body: buffer,
    });

    return fromPromise(
      this.s3Client.send(command),
      (error) => new NetworkError("Failed to store file", error instanceof Error ? error : undefined),
    ).map(() => path);
  }

  listFiles(path: FileLocation): ResultAsync<string[], NetworkError | UnknownError> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: path,
    });

    return fromPromise(
      this.s3Client.send(command),
      (error) => new NetworkError("Failed to list files", error instanceof Error ? error : undefined),
    ).map((response) => {
      if (response.Contents === undefined) return [];

      return response.Contents.map((object) => object.Key ?? undefined).filter(
        (key): key is string => key !== undefined,
      );
    });
  }
}

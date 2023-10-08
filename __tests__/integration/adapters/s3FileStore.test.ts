import { ListObjectsV2CommandOutput, PutObjectCommandOutput, S3Client, S3ServiceException } from "@aws-sdk/client-s3";
import { NetworkError } from "@core/errors/NetworkError";
import { S3FileStore } from "@infrastructure/adapters/s3FileStore";
import { mockDeep } from "jest-mock-extended";
import { ok } from "neverthrow";

const bucketName = "test-bucket";
const s3Client = mockDeep<S3Client>();

const s3FileStore = new S3FileStore(s3Client, bucketName);

describe("S3FileStore - Integration Tests", () => {
  describe("WHEN storing a Buffer at a given path", () => {
    const path = "example/test-path.txt";
    const buffer = Buffer.from("test-buffer");

    describe("GIVEN the S3Client successfully stores the Buffer", () => {
      const putObjectOutput: Partial<PutObjectCommandOutput> = {
        $metadata: {
          httpStatusCode: 200,
        },
      };

      beforeEach(() => {
        s3Client.send.mockResolvedValue(putObjectOutput as never);
      });

      test("THEN the S3Client should be called to store the Buffer", async () => {
        await s3FileStore.store(path, buffer);
        expect(s3Client.send).toHaveBeenCalledTimes(1);
      });
      test("THEN the stored file location should be returned", async () => {
        await expect(s3FileStore.store(path, buffer)).resolves.toEqual(ok(path));
      });
    });

    describe("GIVEN the S3Client throws an S3ServiceException when storing the Buffer", () => {
      const s3ServiceException = new S3ServiceException({
        name: "S3ServiceException",
        $fault: "server",
        $metadata: {
          httpStatusCode: 500,
        },
      });

      beforeEach(() => {
        s3Client.send.mockRejectedValue(s3ServiceException as never);
      });

      test("THEN a NetworkError should be returned, containing the S3ServiceException", async () => {
        const result = await s3FileStore.store(path, buffer);
        const resultError = result._unsafeUnwrapErr();
        expect(resultError).toBeInstanceOf(NetworkError);
        expect((resultError as NetworkError).originalError).toBeInstanceOf(S3ServiceException);
      });
    });
  });

  describe("WHEN listing items at a given path", () => {
    const path = "example/";

    describe("GIVEN the S3Client successfully lists objects at the given path", () => {
      const listObjectsOutput: Partial<ListObjectsV2CommandOutput> = {
        $metadata: {
          httpStatusCode: 200,
        },
        Contents: [
          {
            Key: "example/test-path.txt",
          },
          {
            Key: "example/test-path-2.txt",
          },
        ],
      };

      beforeEach(() => {
        s3Client.send.mockResolvedValue(listObjectsOutput as never);
      });

      test("THEN the S3Client should be called to list objects at the given path", async () => {
        await s3FileStore.listFiles(path);
        expect(s3Client.send).toHaveBeenCalledTimes(1);
      });
      test("THEN the list of files should be returned", async () => {
        await expect(s3FileStore.listFiles(path)).resolves.toEqual(
          ok(["example/test-path.txt", "example/test-path-2.txt"]),
        );
      });
    });

    describe("GIVEN the S3Client successfully lists objects at the given path that do not have a Key", () => {
      const listObjectsOutput: Partial<ListObjectsV2CommandOutput> = {
        $metadata: {
          httpStatusCode: 200,
        },
        Contents: [
          {
            Key: undefined,
          },
          {
            Key: undefined,
          },
        ],
      };

      beforeEach(() => {
        s3Client.send.mockResolvedValue(listObjectsOutput as never);
      });

      test("THEN the S3Client should be called to list objects at the given path", async () => {
        await s3FileStore.listFiles(path);
        expect(s3Client.send).toHaveBeenCalledTimes(1);
      });
      test("THEN the list of files should be returned as empty", async () => {
        await expect(s3FileStore.listFiles(path)).resolves.toEqual(ok([]));
      });
    });

    describe("GIVEN the S3Client throws an S3ServiceException when listing objects at the given path", () => {
      const s3ServiceException = new S3ServiceException({
        name: "S3ServiceException",
        $fault: "server",
        $metadata: {
          httpStatusCode: 500,
        },
      });

      beforeEach(() => {
        s3Client.send.mockRejectedValue(s3ServiceException as never);
      });

      test("THEN a NetworkError should be returned, containing the S3ServiceException", async () => {
        const result = await s3FileStore.listFiles(path);
        const resultError = result._unsafeUnwrapErr();
        expect(resultError).toBeInstanceOf(NetworkError);
        expect((resultError as NetworkError).originalError).toBeInstanceOf(S3ServiceException);
      });
    });
  });
});

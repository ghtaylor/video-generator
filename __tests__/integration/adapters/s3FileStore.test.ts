import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { NetworkError } from "@core/errors/NetworkError";
import { S3FileStore } from "@infrastructure/adapters/s3FileStore";
import { ok } from "neverthrow";
import { GenericContainer, StartedTestContainer } from "testcontainers";

const bucketName = "test-bucket";

describe("S3FileStore - Integration Tests", () => {
  let s3Client: S3Client;
  let container: StartedTestContainer;
  let s3FileStore: S3FileStore;

  beforeAll(async () => {
    container = await new GenericContainer("adobe/s3mock:3.1.0").withExposedPorts(9090).start();

    s3Client = new S3Client({
      region: "eu-west-1",
      endpoint: `http://${container.getHost()}:${container.getMappedPort(9090)}`,
      forcePathStyle: true,
      credentials: {
        accessKeyId: "accessKeyId",
        secretAccessKey: "secretAccessKey",
      },
    });

    s3FileStore = new S3FileStore(s3Client, bucketName);
  });

  afterAll(async () => {
    s3Client.destroy();
    await container.stop();
  });

  describe(`GIVEN a bucket exists with the name "${bucketName}"`, () => {
    beforeAll(async () => {
      const createBucketCommand = new CreateBucketCommand({
        Bucket: bucketName,
      });

      await s3Client.send(createBucketCommand);
    });

    afterAll(async () => {
      const deleteBucketCommand = new DeleteBucketCommand({
        Bucket: bucketName,
      });

      await s3Client.send(deleteBucketCommand);
    });

    describe(`WHEN storing a Buffer at "example/test-path.txt"`, () => {
      afterEach(async () => {
        const deleteObjectCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: "example/test-path.txt",
        });

        await s3Client.send(deleteObjectCommand);
      });

      test("THEN the file should be stored at the given path", async () => {
        await s3FileStore.store("example/test-path.txt", Buffer.from("test-buffer"));

        const listObjectsCommand = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: "example/test-path.txt",
        });

        const listObjectsOutput = await s3Client.send(listObjectsCommand);

        expect(listObjectsOutput.Contents?.length).toEqual(1);
      });

      test("THEN the stored file location should be returned", async () => {
        await expect(s3FileStore.store("example/test-path.txt", Buffer.from("test-buffer"))).resolves.toEqual(
          ok("example/test-path.txt"),
        );
      });
    });

    describe("AND GIVEN two files exist with the prefix 'example/'", () => {
      beforeAll(async () => {
        const putObjectCommand1 = new PutObjectCommand({
          Bucket: bucketName,
          Key: "example/test-path-1.txt",
          Body: Buffer.from("test-buffer"),
        });

        const putObjectCommand2 = new PutObjectCommand({
          Bucket: bucketName,
          Key: "example/test-path-2.txt",
          Body: Buffer.from("test-buffer"),
        });

        await s3Client.send(putObjectCommand1);
        await s3Client.send(putObjectCommand2);
      });

      afterAll(async () => {
        const deleteObjectCommand1 = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: "example/test-path-1.txt",
        });

        const deleteObjectCommand2 = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: "example/test-path-2.txt",
        });

        await s3Client.send(deleteObjectCommand1);
        await s3Client.send(deleteObjectCommand2);
      });

      describe("WHEN listing files with the prefix 'example/'", () => {
        test("THEN the two file paths should be returned", async () => {
          const filePaths = await s3FileStore.listFiles("example/");

          expect(filePaths).toEqual(ok(["example/test-path-1.txt", "example/test-path-2.txt"]));
        });
      });
    });

    describe("AND GIVEN no files exist with the prefix 'example/'", () => {
      describe("WHEN listing files with the prefix 'example/'", () => {
        test("THEN an empty array should be returned", async () => {
          const filePaths = await s3FileStore.listFiles("example/");

          expect(filePaths).toEqual(ok([]));
        });
      });
    });
  });

  describe(`GIVEN a bucket does not exist with the name "${bucketName}"`, () => {
    describe("WHEN storing a Buffer at 'example/test-path.txt'", () => {
      test("THEN an NetworkError should be returned", async () => {
        const result = await s3FileStore.store("example/test-path.txt", Buffer.from("test-buffer"));

        const error = result._unsafeUnwrapErr();
        expect(error).toBeInstanceOf(NetworkError);
        expect(error.message).toEqual(expect.stringContaining("Failed to store file"));
      });
    });

    describe("WHEN listing files with the prefix 'example/'", () => {
      test("THEN a NetworkError should be returned", async () => {
        const result = await s3FileStore.listFiles("example/");

        const error = result._unsafeUnwrapErr();
        expect(error).toBeInstanceOf(NetworkError);
        expect(error.message).toEqual(expect.stringContaining("Failed to list files"));
      });
    });
  });
});

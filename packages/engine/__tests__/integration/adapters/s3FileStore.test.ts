import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { ServiceError } from "@core/errors/ServiceError";
import { S3FileStore } from "@infrastructure/adapters/s3FileStore";
import { ok } from "neverthrow";
import { GenericContainer, StartedTestContainer } from "testcontainers";

const bucketName = "test-bucket";

describe(
  "S3FileStore - Integration Tests",
  () => {
    let s3Client: S3Client;
    let container: StartedTestContainer;
    let s3FileStore: S3FileStore;

    beforeAll(async () => {
      try {
        container = await new GenericContainer("minio/minio:RELEASE.2023-10-25T06-33-25Z")
          .withExposedPorts(9000)
          .withCommand(["server", "/data"])
          .withLogConsumer((stream) => {
            stream.on("data", (line) => console.log(line));
            stream.on("err", (line) => console.error(line));
            stream.on("end", () => console.log("Stream closed"));
          })
          .start();

        s3Client = new S3Client({
          region: "eu-west-1",
          endpoint: `http://${container.getHost()}:${container.getMappedPort(9000)}`,
          credentials: {
            accessKeyId: "minioadmin",
            secretAccessKey: "minioadmin",
          },
          forcePathStyle: true,
        });

        s3FileStore = new S3FileStore(s3Client, bucketName);
      } catch (err) {
        console.log("Error: ", err);
      }
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

            console.log(filePaths);

            expect(filePaths).toEqual(ok(["example/test-path-1.txt", "example/test-path-2.txt"]));
          });
        });

        describe("WHEN getting a URL for the file 'example/test-path-1.txt'", () => {
          test("THEN a URL should be returned", async () => {
            const result = await s3FileStore.getUrl("example/test-path-1.txt");
            const url = result._unsafeUnwrap();
            expect(url).toEqual(expect.stringContaining("example/test-path-1.txt"));
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
        test("THEN an ServiceError should be returned", async () => {
          const result = await s3FileStore.store("example/test-path.txt", Buffer.from("test-buffer"));

          const error = result._unsafeUnwrapErr();
          expect(error).toBeInstanceOf(ServiceError);
          expect(error.message).toEqual(expect.stringContaining("Failed to store file"));
        });
      });

      describe("WHEN listing files with the prefix 'example/'", () => {
        test("THEN a ServiceError should be returned", async () => {
          const result = await s3FileStore.listFiles("example/");

          const error = result._unsafeUnwrapErr();
          expect(error).toBeInstanceOf(ServiceError);
          expect(error.message).toEqual(expect.stringContaining("Failed to list files"));
        });
      });
    });
  },
  {
    timeout: 60_000,
  },
);

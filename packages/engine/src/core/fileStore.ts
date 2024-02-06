import { ResultAsync } from "neverthrow";
import { ServiceError } from "@core/errors/ServiceError";
import { FilePath, FileUrl } from "@video-generator/domain/File";

export interface FileStore {
  store(path: FilePath, buffer: Buffer): ResultAsync<FilePath, ServiceError>;
  listFiles(path: FilePath): ResultAsync<FilePath[], ServiceError>;
  getUrl(path: FilePath): ResultAsync<FileUrl, ServiceError>;
  getBuffer(path: FilePath): ResultAsync<Buffer, ServiceError>;
}

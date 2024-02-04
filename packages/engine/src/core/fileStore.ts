import { ResultAsync } from "neverthrow";
import { NetworkError } from "@core/errors/NetworkError";
import { FilePath, FileUrl } from "@video-generator/domain/File";

export interface FileStore {
  store(path: FilePath, buffer: Buffer): ResultAsync<FilePath, NetworkError>;
  listFiles(path: FilePath): ResultAsync<FilePath[], NetworkError>;
  getUrl(path: FilePath): ResultAsync<FileUrl, NetworkError>;
  getBuffer(path: FilePath): ResultAsync<Buffer, NetworkError>;
}

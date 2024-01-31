import { ResultAsync } from "neverthrow";
import { NetworkError } from "@core/errors/NetworkError";
import { FileLocation, FileUrl } from "@video-generator/domain/File";

export interface FileStore {
  store(path: FileLocation, buffer: Buffer): ResultAsync<FileLocation, NetworkError>;
  listFiles(path: FileLocation): ResultAsync<FileLocation[], NetworkError>;
  getUrl(path: FileLocation): ResultAsync<FileUrl, NetworkError>;
  getBuffer(path: FileLocation): ResultAsync<Buffer, NetworkError>;
}

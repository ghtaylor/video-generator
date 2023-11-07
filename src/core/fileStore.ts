import { ResultAsync } from "neverthrow";
import { NetworkError } from "./errors/NetworkError";
import { FileLocation, FileUrl } from "@domain/FIle";

export interface FileStore {
  store(path: FileLocation, buffer: Buffer): ResultAsync<FileLocation, NetworkError>;
  listFiles(path: FileLocation): ResultAsync<FileLocation[], NetworkError>;
  getUrl(path: FileLocation): ResultAsync<FileUrl, NetworkError>;
  getBuffer(path: FileLocation): ResultAsync<Buffer, NetworkError>;
}

import { ResultAsync } from "neverthrow";
import { NetworkError } from "./errors/NetworkError";

export type FileLocation = string;
export type FileUrl = string;

export interface FileStore {
  store(path: FileLocation, buffer: Buffer): ResultAsync<FileLocation, NetworkError>;
  listFiles(path: FileLocation): ResultAsync<FileLocation[], NetworkError>;
}

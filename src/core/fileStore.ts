import { ResultAsync } from "neverthrow";
import { NetworkError } from "./errors/NetworkError";
import { UnknownError } from "./errors/UnknownError";

export type FileLocation = string;
export type FileUrl = string;

export interface FileStore {
  store(path: FileLocation, buffer: Buffer): ResultAsync<FileLocation, NetworkError | UnknownError>;
  listFiles(path: FileLocation): ResultAsync<FileLocation[], NetworkError | UnknownError>;
}

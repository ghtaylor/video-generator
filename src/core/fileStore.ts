import { ResultAsync } from "neverthrow";
import { NetworkError } from "./errors/NetworkError";
import { UnknownError } from "./errors/UnknownError";

export type FileLocation = string;
export type FileUrl = string;

export interface FileStore {
  store(buffer: Buffer): ResultAsync<FileLocation, NetworkError | UnknownError>;
  getBackgroundVideoLocations(): ResultAsync<FileLocation[], NetworkError | UnknownError>;
}

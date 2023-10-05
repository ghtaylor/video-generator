import { Result } from "true-myth";
import { NetworkError } from "./errors/NetworkError";
import { UnknownError } from "./errors/UnknownError";
import { ResultAsync } from "neverthrow";

export type FileLocation = string;
export type FileUrl = string;

export interface FileStore {
  store(buffer: Buffer): ResultAsync<FileLocation, NetworkError | UnknownError>;
  getBackgroundVideoFiles(): Promise<Result<FileLocation[], NetworkError | UnknownError>>;
}

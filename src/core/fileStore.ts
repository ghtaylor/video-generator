import { Result } from "true-myth";
import { NetworkError } from "./errors/NetworkError";
import { UnknownError } from "./errors/UnknownError";

export type FileLocation = string;

export interface FileStore {
  store(buffer: Buffer): Promise<Result<FileLocation, NetworkError | UnknownError>>;
}

import { ResultAsync } from "neverthrow";
import { ServiceError } from "@core/errors/ServiceError";
import { FilePath, FileUrl } from "@video-generator/domain/File";

export interface FileStore {
  getUrl(path: FilePath): ResultAsync<FileUrl, ServiceError>;
}

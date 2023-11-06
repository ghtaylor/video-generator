import { UploadVideoParams } from "@domain/Video";
import { ResultAsync } from "neverthrow";
import { NetworkError } from "./errors/NetworkError";
import { UnknownError } from "./errors/UnknownError";

export type UrlString = string;

export interface SocialMediaUploader {
  upload(params: UploadVideoParams): ResultAsync<UrlString, NetworkError | UnknownError>;
}

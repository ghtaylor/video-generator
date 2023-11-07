import { UploadVideoPlatform, VideoDataByPlatform, VideoMetadata } from "@domain/Video";
import { ResultAsync } from "neverthrow";
import { NetworkError } from "./errors/NetworkError";

export type VideoId = string;

export interface VideoUploader<TPlatform extends UploadVideoPlatform> {
  readonly platform: TPlatform;

  upload(data: VideoDataByPlatform[TPlatform], metadata: VideoMetadata): ResultAsync<VideoId, NetworkError>;
}

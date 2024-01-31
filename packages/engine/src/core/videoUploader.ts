import { UploadVideoPlatform, VideoDataByPlatform, VideoMetadata } from "@video-generator/domain/Video";
import { ResultAsync } from "neverthrow";
import { NetworkError } from "@core/errors/NetworkError";

export type VideoId = string;

export interface VideoUploader<TPlatform extends UploadVideoPlatform> {
  readonly platform: TPlatform;

  upload(data: VideoDataByPlatform[TPlatform], metadata: VideoMetadata): ResultAsync<VideoId, NetworkError>;
}

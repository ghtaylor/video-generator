import { VideoData, VideoMetadata } from "@domain/Video";
import { ResultAsync } from "neverthrow";
import { NetworkError } from "./errors/NetworkError";

export type VideoId = string;

export interface SocialMediaUploader {
  upload(data: VideoData, metadata: VideoMetadata): ResultAsync<VideoId, NetworkError>;
}

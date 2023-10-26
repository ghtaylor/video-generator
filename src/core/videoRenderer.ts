import { VideoOptions } from "@domain/Video";
import { ResultAsync } from "neverthrow";
import { NetworkError } from "./errors/NetworkError";
import { VideoRenderError } from "./errors/VideoRenderError";

export interface VideoRenderer {
  renderVideo(options: VideoOptions): ResultAsync<Buffer, VideoRenderError>;
}

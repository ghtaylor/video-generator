import { VideoOptions } from "@domain/Video";
import { ResultAsync } from "neverthrow";
import { VideoRenderError } from "./errors/VideoRenderError";

export interface VideoRenderer {
  renderVideo(options: VideoOptions): ResultAsync<Buffer, VideoRenderError>;
}

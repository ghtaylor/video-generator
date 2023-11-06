import { RenderVideoParams } from "@domain/Video";
import { ResultAsync } from "neverthrow";
import { VideoRenderError } from "./errors/VideoRenderError";

export interface VideoRenderer {
  renderVideo(params: RenderVideoParams): ResultAsync<Buffer, VideoRenderError>;
}

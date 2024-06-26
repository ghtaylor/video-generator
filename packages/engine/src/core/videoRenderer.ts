import { RenderVideoParams } from "@video-generator/domain/Video";
import { ResultAsync } from "neverthrow";
import { VideoRenderError } from "@core/errors/VideoRenderError";

export interface VideoRenderer {
  renderVideo(
    params: RenderVideoParams,
    onProgress?: (progress: number) => void,
  ): ResultAsync<Buffer, VideoRenderError>;
}

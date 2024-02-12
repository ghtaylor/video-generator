import { ServiceError } from "@core/errors/ServiceError";
import { VideoRenderError } from "@core/errors/VideoRenderError";
import { FileStore } from "@core/fileStore";
import { VideoRenderer } from "@core/videoRenderer";
import { FilePath } from "@video-generator/domain/File";
import { RenderVideoParams, UploadVideoParams } from "@video-generator/domain/Video";
import { Result, ResultAsync, ok } from "neverthrow";

export class RenderVideoUseCase {
  constructor(
    private readonly videoRenderer: VideoRenderer,
    private readonly fileStore: FileStore,
  ) {}

  private getFilePath(): string {
    return `rendered/${new Date().getTime()}.mp4`;
  }

  private uploadVideoParamsFrom(
    renderVideoParams: RenderVideoParams,
    renderedVideoPath: FilePath,
  ): Result<UploadVideoParams, never> {
    return ok({
      videoPath: renderedVideoPath,
      metadata: renderVideoParams.metadata,
    });
  }

  execute(renderVideoParams: RenderVideoParams): ResultAsync<UploadVideoParams, VideoRenderError | ServiceError> {
    return this.videoRenderer
      .renderVideo(renderVideoParams)
      .andThen((videoBuffer) => this.fileStore.store(this.getFilePath(), videoBuffer))
      .andThen((filePath) => this.uploadVideoParamsFrom(renderVideoParams, filePath));
  }
}

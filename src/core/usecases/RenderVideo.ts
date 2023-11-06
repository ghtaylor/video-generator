import { NetworkError } from "@core/errors/NetworkError";
import { VideoRenderError } from "@core/errors/VideoRenderError";
import { FileLocation, FileStore } from "@core/fileStore";
import { VideoRenderer } from "@core/videoRenderer";
import { UploadVideoParams, RenderVideoParams } from "@domain/Video";
import { Result, ResultAsync, ok } from "neverthrow";

export class RenderVideoUseCase {
  constructor(
    private readonly videoRenderer: VideoRenderer,
    private readonly fileStore: FileStore,
  ) {}

  private getFileLocation(): string {
    return `rendered/${new Date().getTime()}.mp4`;
  }

  private uploadVideoParamsFrom(
    renderVideoParams: RenderVideoParams,
    renderedVideoLocation: FileLocation,
  ): Result<UploadVideoParams, never> {
    return ok({
      videoLocation: renderedVideoLocation,
      metadata: renderVideoParams.metadata,
    });
  }

  execute(renderVideoParams: RenderVideoParams): ResultAsync<UploadVideoParams, VideoRenderError | NetworkError> {
    return this.videoRenderer
      .renderVideo(renderVideoParams)
      .andThen((videoBuffer) => this.fileStore.store(this.getFileLocation(), videoBuffer))
      .andThen((fileLocation) => this.uploadVideoParamsFrom(renderVideoParams, fileLocation));
  }
}

import { ServiceError } from "@core/errors/ServiceError";
import { VideoRenderError } from "@core/errors/VideoRenderError";
import { FileStore } from "@core/fileStore";
import { ProgressReporter } from "@core/progressReporter";
import { VideoRenderer } from "@core/videoRenderer";
import { FilePath } from "@video-generator/domain/File";
import { RenderVideoParams, RenderedVideo } from "@video-generator/domain/Video";
import { Result, ResultAsync, ok } from "neverthrow";

export class RenderVideoUseCase {
  constructor(
    private readonly videoRenderer: VideoRenderer,
    private readonly fileStore: FileStore,
    private readonly progressReporter: ProgressReporter,
  ) {}

  private getFilePath(): string {
    return `rendered/${new Date().getTime()}.mp4`;
  }

  private renderedVideoFrom(
    renderVideoParams: RenderVideoParams,
    renderedVideoPath: FilePath,
  ): Result<RenderedVideo, never> {
    return ok({
      videoPath: renderedVideoPath,
      metadata: renderVideoParams.metadata,
    });
  }

  execute(renderVideoParams: RenderVideoParams): ResultAsync<RenderedVideo, VideoRenderError | ServiceError> {
    return this.progressReporter.reportProgress({ state: "RENDERING_VIDEO", progress: 0.75 }).andThen(() =>
      this.videoRenderer
        .renderVideo(renderVideoParams)
        .andThen((videoBuffer) => this.fileStore.store(this.getFilePath(), videoBuffer))
        .andThen((filePath) => this.renderedVideoFrom(renderVideoParams, filePath)),
    );
  }
}

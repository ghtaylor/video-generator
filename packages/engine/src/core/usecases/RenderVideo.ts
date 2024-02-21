import { ServiceError } from "@core/errors/ServiceError";
import { VideoRenderError } from "@core/errors/VideoRenderError";
import { FileStore } from "@core/fileStore";
import { ProgressReporter } from "@core/progressReporter";
import { VideoRenderer } from "@core/videoRenderer";
import { EngineProgress } from "@video-generator/domain/Engine";
import { FilePath } from "@video-generator/domain/File";
import { RenderVideoParams, RenderedVideo } from "@video-generator/domain/Video";
import round from "lodash.round";
import { Result, ResultAsync, ok } from "neverthrow";

export class RenderVideoUseCase {
  constructor(
    private readonly videoRenderer: VideoRenderer,
    private readonly fileStore: FileStore,
    private readonly progressReporter: ProgressReporter,
    readonly START_ENGINE_PROGRESS = 0.5,
    readonly END_ENGINE_PROGRESS = 0.95,
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

  engineProgressFrom(
    renderProgress: number,
    startEngineProgress: number,
    endEngineProgress: number,
  ): Result<EngineProgress, never> {
    return ok({
      state: "RENDERING_VIDEO",
      progress: round(startEngineProgress + (endEngineProgress - startEngineProgress) * renderProgress, 2),
    });
  }

  reportedRenderProgress = new Set<number>();

  onRenderProgress(renderProgress: number, startEngineProgress: number, endEngineProgress: number): void {
    const shouldReportProgress = (renderProgress * 10) % 1 === 0 && !this.reportedRenderProgress.has(renderProgress);

    if (shouldReportProgress) {
      this.engineProgressFrom(renderProgress, startEngineProgress, endEngineProgress).asyncAndThen((engineProgress) =>
        this.progressReporter.reportProgress(engineProgress),
      );

      this.reportedRenderProgress.add(renderProgress);
    }
  }

  execute(renderVideoParams: RenderVideoParams): ResultAsync<RenderedVideo, VideoRenderError | ServiceError> {
    return this.videoRenderer
      .renderVideo(renderVideoParams, (progress) =>
        this.onRenderProgress(progress, this.START_ENGINE_PROGRESS, this.END_ENGINE_PROGRESS),
      )
      .andThen((videoBuffer) => this.fileStore.store(this.getFilePath(), videoBuffer))
      .andThen((filePath) => this.renderedVideoFrom(renderVideoParams, filePath));
  }
}

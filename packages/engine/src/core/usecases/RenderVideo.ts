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

export type ReportRenderProgressParams = {
  executionId: string;
  renderProgress: number;
  startEngineProgress: number;
  endEngineProgress: number;
};

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

  engineProgressFrom({
    executionId,
    renderProgress,
    startEngineProgress,
    endEngineProgress,
  }: ReportRenderProgressParams): Result<EngineProgress, never> {
    return ok({
      executionId,
      state: "RENDERING_VIDEO",
      progress: round(startEngineProgress + (endEngineProgress - startEngineProgress) * renderProgress, 2),
    });
  }

  reportedRenderProgress = new Set<number>();

  reportRenderProgress({
    executionId,
    renderProgress,
    startEngineProgress,
    endEngineProgress,
  }: ReportRenderProgressParams): void {
    const shouldReportProgress = (renderProgress * 10) % 1 === 0 && !this.reportedRenderProgress.has(renderProgress);

    if (shouldReportProgress) {
      this.engineProgressFrom({ executionId, renderProgress, startEngineProgress, endEngineProgress }).asyncAndThen(
        (engineProgress) => this.progressReporter.reportProgress(engineProgress),
      );

      this.reportedRenderProgress.add(renderProgress);
    }
  }

  execute(
    executionId: string,
    renderVideoParams: RenderVideoParams,
  ): ResultAsync<RenderedVideo, VideoRenderError | ServiceError> {
    return this.videoRenderer
      .renderVideo(renderVideoParams, (renderProgress) =>
        this.reportRenderProgress({
          executionId,
          renderProgress,
          startEngineProgress: this.START_ENGINE_PROGRESS,
          endEngineProgress: this.END_ENGINE_PROGRESS,
        }),
      )
      .andThen((videoBuffer) => this.fileStore.store(this.getFilePath(), videoBuffer))
      .andThen((filePath) => this.renderedVideoFrom(renderVideoParams, filePath));
  }
}

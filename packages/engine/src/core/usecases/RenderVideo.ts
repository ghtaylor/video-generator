import { ServiceError } from "@core/errors/ServiceError";
import { VideoRenderError } from "@core/errors/VideoRenderError";
import { FileStore } from "@core/fileStore";
import { ExecutionManager } from "@core/executionManager";
import { VideoRenderer } from "@core/videoRenderer";
import { ExecutionState } from "@video-generator/domain/Execution";
import { FilePath } from "@video-generator/domain/File";
import { RenderVideoParams, RenderedVideo } from "@video-generator/domain/Video";
import round from "lodash.round";
import { Result, ResultAsync, ok } from "neverthrow";

export type ReportExecutionStateChangedParams = {
  executionId: string;
  renderProgress: number;
  startExecutionState: number;
  endExecutionState: number;
};

export class RenderVideoUseCase {
  constructor(
    private readonly videoRenderer: VideoRenderer,
    private readonly fileStore: FileStore,
    private readonly executionManager: ExecutionManager,
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

  executionStateFrom({
    executionId,
    renderProgress,
    startExecutionState,
    endExecutionState,
  }: ReportExecutionStateChangedParams): Result<ExecutionState, never> {
    return ok({
      executionId,
      state: "RENDERING_VIDEO",
      progress: round(startExecutionState + (endExecutionState - startExecutionState) * renderProgress, 2),
    });
  }

  reportedRenderProgress = new Set<number>();

  reportExecutionStateChanged({
    executionId,
    renderProgress,
    startExecutionState,
    endExecutionState,
  }: ReportExecutionStateChangedParams): void {
    const shouldReportStateChanged =
      (renderProgress * 10) % 1 === 0 && !this.reportedRenderProgress.has(renderProgress);

    if (shouldReportStateChanged) {
      this.executionStateFrom({
        executionId,
        renderProgress,
        startExecutionState,
        endExecutionState,
      }).asyncAndThen(this.executionManager.reportState.bind(this.executionManager));

      this.reportedRenderProgress.add(renderProgress);
    }
  }

  execute(
    executionId: string,
    renderVideoParams: RenderVideoParams,
  ): ResultAsync<RenderedVideo, VideoRenderError | ServiceError> {
    return this.videoRenderer
      .renderVideo(renderVideoParams, (renderProgress) =>
        this.reportExecutionStateChanged({
          executionId,
          renderProgress,
          startExecutionState: this.START_ENGINE_PROGRESS,
          endExecutionState: this.END_ENGINE_PROGRESS,
        }),
      )
      .andThen((videoBuffer) => this.fileStore.store(this.getFilePath(), videoBuffer))
      .andThen((filePath) => this.renderedVideoFrom(renderVideoParams, filePath));
  }
}

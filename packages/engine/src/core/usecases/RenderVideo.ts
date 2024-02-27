import { ServiceError } from "@core/errors/ServiceError";
import { VideoRenderError } from "@core/errors/VideoRenderError";
import { EventSender } from "@core/eventSender";
import { FileStore } from "@core/fileStore";
import { VideoRenderer } from "@core/videoRenderer";
import { ExecutionState } from "@video-generator/domain/Execution";
import { FilePath } from "@video-generator/domain/File";
import { RenderVideoParams, RenderedVideo } from "@video-generator/domain/Video";
import round from "lodash.round";
import { Result, ResultAsync, ok } from "neverthrow";

export type SendExecutionStateChangedParams = {
  executionId: string;
  renderProgress: number;
  startExecutionStateProgress: number;
  endExecutionStateProgress: number;
};

export class RenderVideoUseCase {
  constructor(
    private readonly videoRenderer: VideoRenderer,
    private readonly fileStore: FileStore,
    private readonly eventSender: EventSender,
    readonly START_EXECUTION_STATE_PROGRESS = 0.5,
    readonly END_EXECUTION_STATE_PROGRESS = 0.95,
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
    startExecutionStateProgress,
    endExecutionStateProgress,
  }: SendExecutionStateChangedParams): Result<ExecutionState, never> {
    return ok({
      executionId,
      state: "RENDERING_VIDEO",
      progress: round(
        startExecutionStateProgress + (endExecutionStateProgress - startExecutionStateProgress) * renderProgress,
        2,
      ),
    });
  }

  reportedRenderProgress = new Set<number>();

  sendExecutionStateChanged({
    executionId,
    renderProgress,
    startExecutionStateProgress,
    endExecutionStateProgress,
  }: SendExecutionStateChangedParams): void {
    const shouldReportStateChanged =
      (renderProgress * 10) % 1 === 0 && !this.reportedRenderProgress.has(renderProgress);

    if (shouldReportStateChanged) {
      this.executionStateFrom({
        executionId,
        renderProgress,
        startExecutionStateProgress,
        endExecutionStateProgress,
      }).asyncAndThen((executionState) => this.eventSender.sendEvent("executionStateChanged", executionState));

      this.reportedRenderProgress.add(renderProgress);
    }
  }

  execute(
    executionId: string,
    renderVideoParams: RenderVideoParams,
  ): ResultAsync<RenderedVideo, VideoRenderError | ServiceError> {
    return this.videoRenderer
      .renderVideo(renderVideoParams, (renderProgress) =>
        this.sendExecutionStateChanged({
          executionId,
          renderProgress,
          startExecutionStateProgress: this.START_EXECUTION_STATE_PROGRESS,
          endExecutionStateProgress: this.END_EXECUTION_STATE_PROGRESS,
        }),
      )
      .andThen((videoBuffer) => this.fileStore.store(this.getFilePath(), videoBuffer))
      .andThen((filePath) => this.renderedVideoFrom(renderVideoParams, filePath));
  }
}

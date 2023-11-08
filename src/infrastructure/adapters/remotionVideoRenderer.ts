import { VideoRenderError } from "@core/errors/VideoRenderError";
import { VideoRenderer } from "@core/videoRenderer";
import { RenderVideoParams } from "@domain/Video";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { ResultAsync, errAsync, fromPromise, okAsync } from "neverthrow";
import { VideoConfig } from "remotion";

export class RemotionVideoRenderer implements VideoRenderer {
  constructor(
    private readonly serveUrl: string,
    private readonly videoId: string,
    private readonly chromiumExecutablePath?: string,
  ) {}

  private selectComposition(params: RenderVideoParams): ResultAsync<VideoConfig, VideoRenderError> {
    return fromPromise(
      selectComposition({
        serveUrl: this.serveUrl,
        browserExecutable: this.chromiumExecutablePath,
        id: this.videoId,
        inputProps: params,
      }),
      (error) => new VideoRenderError("Failed to select composition", error instanceof Error ? error : undefined),
    );
  }

  private renderMedia(composition: VideoConfig, params: RenderVideoParams): ResultAsync<Buffer, VideoRenderError> {
    return fromPromise(
      renderMedia({
        composition,
        serveUrl: this.serveUrl,
        browserExecutable: this.chromiumExecutablePath,
        codec: "h264",
        inputProps: params,
        outputLocation: null,
        onProgress: ({ progress }) => {
          console.log("Progress:", progress);
        },
      }),
      (error) => new VideoRenderError("Failed to render media", error instanceof Error ? error : undefined),
    ).andThen(({ buffer }) => {
      if (buffer === null) return errAsync(new VideoRenderError("Failed to render media due to null buffer"));
      return okAsync(buffer);
    });
  }

  renderVideo(params: RenderVideoParams): ResultAsync<Buffer, VideoRenderError> {
    return this.selectComposition(params).andThen((composition) => this.renderMedia(composition, params));
  }
}

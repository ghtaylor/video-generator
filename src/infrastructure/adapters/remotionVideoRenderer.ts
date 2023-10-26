import { VideoRenderError } from "@core/errors/VideoRenderError";
import { VideoRenderer } from "@core/videoRenderer";
import { VideoOptions } from "@domain/Video";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { ResultAsync, errAsync, fromPromise, okAsync } from "neverthrow";
import { VideoConfig } from "remotion";

export class RemotionVideoRenderer implements VideoRenderer {
  constructor(
    private readonly serveUrl: string,
    private readonly videoId: string,
    private readonly chromiumExecutablePath?: string,
  ) {}

  private selectComposition(videoOptions: VideoOptions): ResultAsync<VideoConfig, VideoRenderError> {
    console.log(
      "Selecting composition",
      JSON.stringify(
        { videoOptions, serveUrl: this.serveUrl, browserExecutable: this.chromiumExecutablePath, id: this.videoId },
        null,
        2,
      ),
    );

    return fromPromise(
      selectComposition({
        serveUrl: this.serveUrl,
        browserExecutable: this.chromiumExecutablePath,
        id: this.videoId,
        inputProps: videoOptions,
      }),
      (error) => new VideoRenderError("Failed to select composition", error instanceof Error ? error : undefined),
    );
  }

  private renderMedia(composition: VideoConfig, videoOptions: VideoOptions): ResultAsync<Buffer, VideoRenderError> {
    console.log(
      "Rendering media",
      JSON.stringify(
        { composition, serveUrl: this.serveUrl, browserExecutable: this.chromiumExecutablePath, id: this.videoId },
        null,
        2,
      ),
    );

    return fromPromise(
      renderMedia({
        composition,
        serveUrl: this.serveUrl,
        browserExecutable: this.chromiumExecutablePath,
        codec: "h264",
        inputProps: videoOptions,
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

  renderVideo(options: VideoOptions): ResultAsync<Buffer, VideoRenderError> {
    return this.selectComposition(options).andThen((composition) => this.renderMedia(composition, options));
  }
}

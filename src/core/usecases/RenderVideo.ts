import { NetworkError } from "@core/errors/NetworkError";
import { VideoRenderError } from "@core/errors/VideoRenderError";
import { FileLocation, FileStore } from "@core/fileStore";
import { VideoRenderer } from "@core/videoRenderer";
import { VideoDetails, VideoOptions } from "@domain/Video";
import { Result, ResultAsync, ok } from "neverthrow";

export class RenderVideoUseCase {
  constructor(
    private readonly videoRenderer: VideoRenderer,
    private readonly fileStore: FileStore,
  ) {}

  private getFileLocation(): string {
    return `/rendered/${new Date().getTime()}.mp4`;
  }

  private getVideoDetails(
    videoOptions: VideoOptions,
    renderedVideoLocation: FileLocation,
  ): Result<VideoDetails, never> {
    return ok({
      videoLocation: renderedVideoLocation,
      description: videoOptions.description,
      tags: [],
    });
  }

  execute(videoOptions: VideoOptions): ResultAsync<VideoDetails, VideoRenderError | NetworkError> {
    return this.videoRenderer
      .renderVideo(videoOptions)
      .andThen((videoBuffer) => this.fileStore.store(this.getFileLocation(), videoBuffer))
      .andThen((fileLocation) => this.getVideoDetails(videoOptions, fileLocation));
  }
}

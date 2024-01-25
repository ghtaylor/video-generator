import { NetworkError } from "@core/errors/NetworkError";
import { VideoRenderError } from "@core/errors/VideoRenderError";
import { FileStore } from "@core/fileStore";
import { MessageSender } from "@core/messageSender";
import { VideoRenderer } from "@core/videoRenderer";
import { FileLocation } from "@domain/File";
import { RenderedVideo, RenderVideoParams } from "@domain/Video";
import { Result, ResultAsync, ok } from "neverthrow";

export class RenderVideoUseCase {
  constructor(
    private readonly videoRenderer: VideoRenderer,
    private readonly fileStore: FileStore,
    private readonly uploadVideoMessageSender: MessageSender<RenderedVideo>,
  ) {}

  private getFileLocation(): string {
    return `rendered/${new Date().getTime()}.mp4`;
  }

  private renderedVideoFrom(
    { metadata }: RenderVideoParams,
    videoLocation: FileLocation,
  ): Result<RenderedVideo, never> {
    return ok({
      videoLocation,
      metadata,
    });
  }

  execute(renderVideoParams: RenderVideoParams): ResultAsync<RenderedVideo, VideoRenderError | NetworkError> {
    return this.videoRenderer
      .renderVideo(renderVideoParams)
      .andThen((videoBuffer) => this.fileStore.store(this.getFileLocation(), videoBuffer))
      .andThen((fileLocation) => this.renderedVideoFrom(renderVideoParams, fileLocation))
      .andThen(this.uploadVideoMessageSender.send.bind(this.uploadVideoMessageSender));
  }
}

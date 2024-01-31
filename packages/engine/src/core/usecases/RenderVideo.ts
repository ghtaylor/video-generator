import { NetworkError } from "@core/errors/NetworkError";
import { VideoRenderError } from "@core/errors/VideoRenderError";
import { FileStore } from "@core/fileStore";
import { MessageSender } from "@core/messageSender";
import { VideoRenderer } from "@core/videoRenderer";
import { FileLocation } from "@video-generator/domain/File";
import { UploadVideoParams, RenderVideoParams } from "@video-generator/domain/Video";
import { Result, ResultAsync, ok } from "neverthrow";

export class RenderVideoUseCase {
  constructor(
    private readonly videoRenderer: VideoRenderer,
    private readonly fileStore: FileStore,
    private readonly uploadVideoMessageSender: MessageSender<UploadVideoParams>,
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
      .andThen((fileLocation) => this.uploadVideoParamsFrom(renderVideoParams, fileLocation))
      .andThen(this.uploadVideoMessageSender.send.bind(this.uploadVideoMessageSender));
  }
}

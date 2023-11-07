import { NetworkError } from "@core/errors/NetworkError";
import { FileStore } from "@core/fileStore";
import { SocialMediaUploader, VideoId } from "@core/socialMediaUploader";
import { FileLocation } from "@domain/FIle";
import { UploadVideoParams, VideoData, VideoDataKind } from "@domain/Video";
import { ResultAsync } from "neverthrow";

export class UploadVideoUseCase {
  constructor(
    private readonly socialMediaUploader: SocialMediaUploader,
    private readonly fileStore: FileStore,
  ) {}

  getVideoData(kind: VideoDataKind, videoLocation: FileLocation): ResultAsync<VideoData, NetworkError> {
    if (kind === VideoDataKind.Buffer) {
      return this.fileStore.getBuffer(videoLocation).map((buffer) => ({
        kind: VideoDataKind.Buffer,
        buffer,
      }));
    }

    return this.fileStore.getUrl(videoLocation).map((url) => ({
      kind: VideoDataKind.Url,
      url,
    }));
  }

  execute(
    { videoLocation, metadata }: UploadVideoParams,
    videoDataKind: VideoDataKind,
  ): ResultAsync<VideoId, NetworkError> {
    return this.getVideoData(videoDataKind, videoLocation).andThen((videoData) =>
      this.socialMediaUploader.upload(videoData, metadata),
    );
  }
}

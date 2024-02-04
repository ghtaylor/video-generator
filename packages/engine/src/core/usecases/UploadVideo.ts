import { NetworkError } from "@core/errors/NetworkError";
import { ValidationError } from "@core/errors/ValidationError";
import { FileStore } from "@core/fileStore";
import { VideoId, VideoUploader } from "@core/videoUploader";
import { FilePath } from "@video-generator/domain/File";
import { UploadVideoParams, UploadVideoPlatform, VideoData } from "@video-generator/domain/Video";
import { ResultAsync } from "neverthrow";

export class UploadVideoUseCase {
  constructor(
    private readonly videoUploader: VideoUploader<UploadVideoPlatform>,
    private readonly fileStore: FileStore,
  ) {}

  private getVideoData(videoPath: FilePath): ResultAsync<VideoData, NetworkError> {
    // if (this.videoUploader.platform === UploadVideoPlatform.YouTube)
    return this.fileStore.getBuffer(videoPath);

    // return this.fileStore.getUrl(videoPath);
  }

  execute({ videoPath, metadata }: UploadVideoParams): ResultAsync<VideoId, NetworkError | ValidationError> {
    return this.getVideoData(videoPath).andThen((videoData) => this.videoUploader.upload(videoData, metadata));
  }
}

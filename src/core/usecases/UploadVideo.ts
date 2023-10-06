import { NetworkError } from "@core/errors/NetworkError";
import { UnknownError } from "@core/errors/UnknownError";
import { SocialMediaUploader } from "@core/socialMediaUploader";
import { VideoDetails } from "@domain/Video";
import { ResultAsync } from "neverthrow";

export class UploadVideoUseCase {
  constructor(private readonly socialMediaUploader: SocialMediaUploader) {}

  execute(videoDetails: VideoDetails): ResultAsync<null, NetworkError | UnknownError> {
    return this.socialMediaUploader.upload(videoDetails).map(() => null);
  }
}

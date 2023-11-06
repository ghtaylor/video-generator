import { NetworkError } from "@core/errors/NetworkError";
import { SocialMediaUploader } from "@core/socialMediaUploader";
import { UploadVideoParams } from "@domain/Video";
import { ResultAsync } from "neverthrow";

export class UploadVideoUseCase {
  constructor(private readonly socialMediaUploader: SocialMediaUploader) {}

  execute(params: UploadVideoParams): ResultAsync<null, NetworkError> {
    return this.socialMediaUploader.upload(params).map(() => null);
  }
}

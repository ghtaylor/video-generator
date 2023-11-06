import { NetworkError } from "@core/errors/NetworkError";
import { UnknownError } from "@core/errors/UnknownError";
import { SocialMediaUploader } from "@core/socialMediaUploader";
import { UploadVideoParams } from "@domain/Video";
import { ResultAsync } from "neverthrow";

export class UploadVideoUseCase {
  constructor(private readonly socialMediaUploader: SocialMediaUploader) {}

  execute(params: UploadVideoParams): ResultAsync<null, NetworkError | UnknownError> {
    return this.socialMediaUploader.upload(params).map(() => null);
  }
}

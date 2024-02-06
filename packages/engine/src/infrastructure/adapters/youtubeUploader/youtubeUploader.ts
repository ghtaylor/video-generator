import { ServiceError } from "@core/errors/ServiceError";
import { VideoUploader } from "@core/videoUploader";
import { YoutubeCredentials } from "@infrastructure/adapters/youtubeUploader/credentials";
import { UploadVideoPlatform, VideoMetadata } from "@video-generator/domain/Video";
import { google, youtube_v3 } from "googleapis";
import { Result, ResultAsync, errAsync, fromPromise, ok, okAsync } from "neverthrow";
import { Readable } from "stream";

export class YoutubeUploader implements VideoUploader<UploadVideoPlatform.YouTube> {
  readonly platform = UploadVideoPlatform.YouTube;

  constructor(private readonly credentials: YoutubeCredentials) {}

  private getAccessToken(): ResultAsync<string, ServiceError> {
    const oAuthClient = new google.auth.OAuth2({
      clientId: this.credentials.clientId,
      clientSecret: this.credentials.clientSecret,
      credentials: {
        refresh_token: this.credentials.refreshToken,
        scope: "https://www.googleapis.com/auth/youtube.upload",
        token_type: "Bearer",
      },
    });

    return fromPromise(
      oAuthClient.getAccessToken(),
      (error) => new ServiceError("Error getting access token for YouTube", error instanceof Error ? error : undefined),
    ).andThen(({ token }) => {
      if (!token) return errAsync(new ServiceError("No token in response from Google"));
      return okAsync(token);
    });
  }

  private insertYoutubeVideo(insert: youtube_v3.Params$Resource$Videos$Insert): ResultAsync<string, ServiceError> {
    return fromPromise(
      google.youtube("v3").videos.insert(insert),
      (error) => new ServiceError("Error uploading video to YouTube", error instanceof Error ? error : undefined),
    ).andThen((a) => {
      if (a.status !== 200) return errAsync(new ServiceError("Error uploading video to YouTube"));
      return okAsync(a.data.id!);
    });
  }

  private youtubeInsertParamsFrom(
    metadata: VideoMetadata,
    accessToken: string,
    videoBuffer: Buffer,
  ): Result<youtube_v3.Params$Resource$Videos$Insert, never> {
    return ok({
      access_token: accessToken,
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: metadata.title,
          categoryId: "24",
          description: metadata.description,
        },
      },
      media: {
        body: Readable.from(videoBuffer),
      },
    });
  }

  upload(data: Buffer, metadata: VideoMetadata): ResultAsync<string, ServiceError> {
    return this.getAccessToken()
      .andThen((accessToken) => this.youtubeInsertParamsFrom(metadata, accessToken, data))
      .andThen(this.insertYoutubeVideo);
  }
}

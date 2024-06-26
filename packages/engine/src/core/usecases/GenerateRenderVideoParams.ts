import { ServiceError } from "@core/errors/ServiceError";
import { UnexpectedError } from "@core/errors/UnexpectedError";
import { ValidationError } from "@core/errors/ValidationError";
import { FileStore } from "@core/fileStore";
import { FilePath, FileUrl } from "@video-generator/domain/File";
import { SpokenQuote } from "@video-generator/domain/Quote";
import {
  RenderVideoParams,
  VideoConfig,
  VideoResourcePaths,
  VideoResourceUrls,
  VideoSection,
} from "@video-generator/domain/Video";
import { Result, ResultAsync, errAsync, fromThrowable, ok, okAsync } from "neverthrow";

export class GenerateRenderVideoParamsUseCase {
  constructor(private readonly fileStore: FileStore) {}

  videoResourceUrlsFrom({
    backgroundVideoPaths,
    speechAudioPath,
    musicAudioPath,
  }: VideoResourcePaths): ResultAsync<VideoResourceUrls, ServiceError | ValidationError> {
    if (backgroundVideoPaths.length === 0)
      return errAsync(new ValidationError("At least one background video is required"));

    return ResultAsync.combine([
      this.fileStore.getUrl(speechAudioPath),
      this.getFileUrls(backgroundVideoPaths),
      musicAudioPath ? this.fileStore.getUrl(musicAudioPath) : okAsync(undefined),
    ]).andThen(([speechAudioUrl, backgroundVideoUrls, musicAudioUrl]) =>
      ok({
        speechAudioUrl,
        backgroundVideoUrls,
        musicAudioUrl,
      }),
    );
  }

  renderVideoParamsFrom(
    spokenQuote: SpokenQuote,
    { speechAudioUrl, backgroundVideoUrls, musicAudioUrl }: VideoResourceUrls,
    fps: VideoConfig["fps"],
  ): Result<RenderVideoParams, UnexpectedError> {
    return fromThrowable(
      () => {
        const sections: VideoSection[] = [];

        for (let i = 0; i < spokenQuote.chunks.length; i++) {
          const backgroundVideoUrl = backgroundVideoUrls[i % backgroundVideoUrls.length];

          const spokenQuoteChunk = spokenQuote.chunks[i];
          const nextSpokenQuoteChunk = spokenQuote.chunks[i + 1];

          if (!nextSpokenQuoteChunk) {
            const durationInFrames = Math.round(((spokenQuoteChunk.end - spokenQuoteChunk.start) / 1000) * fps);
            const text = spokenQuoteChunk.value;
            sections.push({ text, durationInFrames, backgroundVideoUrl });
            continue;
          }

          const durationInFrames = Math.round(((nextSpokenQuoteChunk.start - spokenQuoteChunk.start) / 1000) * fps);
          const text = spokenQuoteChunk.value;
          sections.push({ text, durationInFrames, backgroundVideoUrl });
        }

        return {
          fps,
          speechAudioUrl,
          musicAudioUrl,
          sections,
          metadata: {
            title: spokenQuote.title,
            description: spokenQuote.text,
          },
        };
      },
      (error) => new UnexpectedError({ originalError: error }),
    )();
  }

  private getFileUrls(backgroundVideoPaths: FilePath[]): ResultAsync<FileUrl[], ServiceError> {
    return ResultAsync.combine(backgroundVideoPaths.map(this.fileStore.getUrl.bind(this.fileStore)));
  }

  execute(
    spokenQuote: SpokenQuote,
    videoConfig: VideoConfig,
  ): ResultAsync<RenderVideoParams, ServiceError | ValidationError | UnexpectedError> {
    return this.videoResourceUrlsFrom({
      backgroundVideoPaths: videoConfig.backgroundVideoPaths,
      speechAudioPath: spokenQuote.speechAudioPath,
      musicAudioPath: videoConfig.musicAudioPath,
    }).andThen((videoResources) => this.renderVideoParamsFrom(spokenQuote, videoResources, videoConfig.fps));
  }
}

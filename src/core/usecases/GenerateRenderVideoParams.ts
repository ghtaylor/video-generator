import { NetworkError } from "@core/errors/NetworkError";
import { FileStore } from "@core/fileStore";
import { MessageSender } from "@core/messageSender";
import { FileUrl, FileLocation } from "@domain/File";
import { SpokenQuote } from "@domain/SpokenQuote";
import { RenderVideoParams, RenderVideoSection } from "@domain/Video";
import shuffle from "lodash.shuffle";
import { Result, ResultAsync, ok } from "neverthrow";

export class GenerateRenderVideoParamsUseCase {
  constructor(
    private readonly fileStore: FileStore,
    private readonly renderVideoMessageSender: MessageSender<RenderVideoParams>,
  ) {}

  renderVideoParamsFrom(
    spokenQuote: SpokenQuote,
    backgroundVideoUrls: FileUrl[],
    fps: number,
  ): Result<RenderVideoParams, never> {
    const videoSections: RenderVideoSection[] = [];

    backgroundVideoUrls = shuffle(backgroundVideoUrls);

    for (let i = 0; i < spokenQuote.chunks.length; i++) {
      const backgroundVideoUrl = backgroundVideoUrls[i % backgroundVideoUrls.length];

      const spokenQuoteChunk = spokenQuote.chunks[i];
      const nextSpokenQuoteChunk = spokenQuote.chunks[i + 1];

      if (!nextSpokenQuoteChunk) {
        const durationInFrames = Math.round(((spokenQuoteChunk.end - spokenQuoteChunk.start) / 1000) * fps);
        const text = spokenQuoteChunk.value;
        videoSections.push({ text, durationInFrames, backgroundVideoUrl });
        continue;
      }

      const durationInFrames = Math.round(((nextSpokenQuoteChunk.start - spokenQuoteChunk.start) / 1000) * fps);
      const text = spokenQuoteChunk.value;
      videoSections.push({ text, durationInFrames, backgroundVideoUrl });
    }

    return ok({
      fps,
      speechAudioUrl: spokenQuote.audioUrl,
      sections: videoSections,
      metadata: {
        title: spokenQuote.title,
        description: spokenQuote.text,
      },
    });
  }

  private getFileUrls(backgroundVideoLocations: FileLocation[]): ResultAsync<FileUrl[], NetworkError> {
    return ResultAsync.combine(backgroundVideoLocations.map(this.fileStore.getUrl.bind(this.fileStore)));
  }

  execute(
    spokenQuote: SpokenQuote,
    fps: number,
    backgroundVideosLocation: FileLocation,
  ): ResultAsync<RenderVideoParams, NetworkError> {
    return this.fileStore
      .listFiles(backgroundVideosLocation)
      .andThen(this.getFileUrls.bind(this))
      .andThen((backgroundVideoUrls) => this.renderVideoParamsFrom(spokenQuote, backgroundVideoUrls, fps))
      .andThen(this.renderVideoMessageSender.send.bind(this.renderVideoMessageSender));
  }
}

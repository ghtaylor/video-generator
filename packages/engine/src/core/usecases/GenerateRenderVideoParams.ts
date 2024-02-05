import { NetworkError } from "@core/errors/NetworkError";
import { FileStore } from "@core/fileStore";
import { MessageSender } from "@core/messageSender";
import { FileUrl, FilePath } from "@video-generator/domain/File";
import { SpokenQuote } from "@video-generator/domain/Quote";
import { RenderVideoParams, RenderVideoSection } from "@video-generator/domain/Video";
import shuffle from "lodash.shuffle";
import { Result, ResultAsync, ok } from "neverthrow";

export class GenerateRenderVideoParamsUseCase {
  constructor(
    private readonly fileStore: FileStore,
    private readonly onComplete: MessageSender<RenderVideoParams>,
  ) {}

  renderVideoParamsFrom(
    spokenQuote: SpokenQuote,
    speechAudioUrl: FileUrl,
    backgroundVideoUrls: FileUrl[],
    musicAudioUrls: FileUrl[],
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
      speechAudioUrl,
      musicAudioUrl: musicAudioUrls[Math.floor(Math.random() * musicAudioUrls.length)],
      sections: videoSections,
      metadata: {
        title: spokenQuote.title,
        description: spokenQuote.text,
      },
    });
  }

  private getFileUrls(backgroundVideoPaths: FilePath[]): ResultAsync<FileUrl[], NetworkError> {
    return ResultAsync.combine(backgroundVideoPaths.map(this.fileStore.getUrl.bind(this.fileStore)));
  }

  execute(
    spokenQuote: SpokenQuote,
    fps: number,
    backgroundVideosPath: FilePath,
    musicAudiosPath: FilePath,
  ): ResultAsync<RenderVideoParams, NetworkError> {
    return ResultAsync.combine([
      this.fileStore.getUrl(spokenQuote.audioFile),
      this.fileStore.listFiles(backgroundVideosPath).andThen(this.getFileUrls.bind(this)),
      this.fileStore.listFiles(musicAudiosPath).andThen(this.getFileUrls.bind(this)),
    ])
      .andThen(([speechAudioUrl, backgroundVideoUrls, musicAudioUrls]) =>
        this.renderVideoParamsFrom(spokenQuote, speechAudioUrl, backgroundVideoUrls, musicAudioUrls, fps),
      )
      .andThen(this.onComplete.send.bind(this.onComplete));
  }
}

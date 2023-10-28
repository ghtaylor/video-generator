import { NetworkError } from "@core/errors/NetworkError";
import { UnknownError } from "@core/errors/UnknownError";
import { FileLocation, FileStore, FileUrl } from "@core/fileStore";
import { Queue } from "@core/queue";
import { SpokenQuote } from "@domain/SpokenQuote";
import { VideoOptions, VideoSection } from "@domain/Video";
import shuffle from "lodash.shuffle";
import { Result, ResultAsync, ok } from "neverthrow";

export class GenerateVideoOptionsUseCase {
  constructor(
    private readonly fileStore: FileStore,
    private readonly createVideoQueue: Queue<VideoOptions>,
  ) {}

  createVideoOptions(
    spokenQuote: SpokenQuote,
    backgroundVideoUrls: FileUrl[],
    fps: number,
  ): Result<VideoOptions, never> {
    const videoSections: VideoSection[] = [];

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
      description: spokenQuote.text,
      speechAudioUrl: spokenQuote.audioUrl,
      sections: videoSections,
    });
  }

  private getFileUrls(backgroundVideoLocations: FileLocation[]): ResultAsync<FileUrl[], NetworkError> {
    return ResultAsync.combine(backgroundVideoLocations.map(this.fileStore.getUrl.bind(this.fileStore)));
  }

  execute(
    spokenQuote: SpokenQuote,
    fps: number,
    backgroundVideosLocation: FileLocation,
  ): ResultAsync<VideoOptions, NetworkError> {
    return this.fileStore
      .listFiles(backgroundVideosLocation)
      .andThen(this.getFileUrls.bind(this))
      .andThen((backgroundVideoUrls) => this.createVideoOptions(spokenQuote, backgroundVideoUrls, fps))
      .andThen(this.createVideoQueue.enqueue.bind(this.createVideoQueue));
  }
}

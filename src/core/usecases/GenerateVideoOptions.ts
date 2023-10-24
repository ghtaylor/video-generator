import { NetworkError } from "@core/errors/NetworkError";
import { UnknownError } from "@core/errors/UnknownError";
import { FileLocation, FileStore } from "@core/fileStore";
import { Queue } from "@core/queue";
import { SpokenQuote } from "@domain/SpokenQuote";
import { VideoOptions, VideoSection } from "@domain/Video";
import { Result, ResultAsync, ok } from "neverthrow";

export class GenerateVideoOptionsUseCase {
  constructor(
    private readonly fileStore: FileStore,
    private readonly createVideoQueue: Queue<VideoOptions>,
  ) {}

  createVideoOptions(
    spokenQuote: SpokenQuote,
    backgroundVideoLocations: FileLocation[],
    fps: number,
  ): Result<VideoOptions, never> {
    const videoSections: VideoSection[] = [];

    for (let i = 0; i < spokenQuote.chunks.length; i++) {
      const backgroundVideoLocation = backgroundVideoLocations[i % backgroundVideoLocations.length];

      const spokenQuoteChunk = spokenQuote.chunks[i];
      const nextSpokenQuoteChunk = spokenQuote.chunks[i + 1];

      if (!nextSpokenQuoteChunk) {
        const durationInFrames = Math.round(((spokenQuoteChunk.end - spokenQuoteChunk.start) / 1000) * fps);
        const text = spokenQuoteChunk.value;
        videoSections.push({ text, durationInFrames, backgroundVideoLocation });
        continue;
      }

      const durationInFrames = Math.round(((nextSpokenQuoteChunk.start - spokenQuoteChunk.start) / 1000) * fps);
      const text = spokenQuoteChunk.value;
      videoSections.push({ text, durationInFrames, backgroundVideoLocation });
    }

    return ok({
      fps,
      description: spokenQuote.text,
      speechAudioLocation: spokenQuote.audioLocation,
      sections: videoSections,
    });
  }

  execute(
    spokenQuote: SpokenQuote,
    fps: number,
    backgroundVideosLocation: FileLocation,
  ): ResultAsync<VideoOptions, NetworkError> {
    return this.fileStore
      .listFiles(backgroundVideosLocation)
      .andThen((backgroundVideoLocations) => this.createVideoOptions(spokenQuote, backgroundVideoLocations, fps))
      .andThen(this.createVideoQueue.enqueue.bind(this.createVideoQueue));
  }
}

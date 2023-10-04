import { NetworkError } from "@core/errors/NetworkError";
import { UnknownError } from "@core/errors/UnknownError";
import { FileLocation, FileStore } from "@core/fileStore";
import { Queue } from "@core/queue";
import { SpokenQuote, SpokenQuoteChunk } from "@domain/SpokenQuote";
import { VideoSection, VideoMetadata } from "@domain/VideoMetadata";
import { Result, Unit } from "true-myth";

export class GenerateVideoMetadataUseCase {
  constructor(
    private readonly fileStore: FileStore,
    private readonly createVideoQueue: Queue<VideoMetadata>,
  ) {}

  createVideoSections(
    spokenQuoteChunks: SpokenQuoteChunk[],
    backgroundVideoLocations: FileLocation[],
    fps: number,
  ): VideoSection[] {
    const baseVideoSections: VideoSection[] = [];

    for (let i = 0; i < spokenQuoteChunks.length; i++) {
      const backgroundVideoLocation = backgroundVideoLocations[i % backgroundVideoLocations.length];

      const spokenQuoteChunk = spokenQuoteChunks[i];
      const nextSpokenQuoteChunk = spokenQuoteChunks[i + 1];

      if (!nextSpokenQuoteChunk) {
        const durationInFrames = Math.ceil((spokenQuoteChunk.end - spokenQuoteChunk.start) / fps);
        const text = spokenQuoteChunk.value;
        baseVideoSections.push({ text, durationInFrames, backgroundVideoLocation });
        continue;
      }

      const durationInFrames = Math.ceil((nextSpokenQuoteChunk.start - spokenQuoteChunk.start) / fps);
      const text = spokenQuoteChunk.value;
      baseVideoSections.push({ text, durationInFrames, backgroundVideoLocation });
    }

    return baseVideoSections;
  }

  async execute(spokenQuote: SpokenQuote, fps: number): Promise<Result<Unit, NetworkError | UnknownError>> {
    const backgroundVideoLocationsResult = await this.fileStore.getBackgroundVideoFiles();
    if (backgroundVideoLocationsResult.isErr) return Result.err(backgroundVideoLocationsResult.error);
    const { value: backgroundVideoLocations } = backgroundVideoLocationsResult;

    const videoSections = this.createVideoSections(spokenQuote.chunks, backgroundVideoLocations, fps);

    return this.createVideoQueue.enqueue({
      fps,
      description: spokenQuote.text,
      sections: videoSections,
    });
  }
}

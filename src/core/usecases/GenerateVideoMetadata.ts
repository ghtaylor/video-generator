import { NetworkError } from "@core/errors/NetworkError";
import { UnknownError } from "@core/errors/UnknownError";
import { FileStore } from "@core/fileStore";
import { Queue } from "@core/queue";
import { SpokenQuote, SpokenQuoteChunk } from "@domain/SpokenQuote";
import { BaseVideoSection, VideoMetadata } from "@domain/VideoMetadata";
import { Result, Unit } from "true-myth";

export class GenerateVideoMetadataUseCase {
  constructor(
    private readonly fileStore: FileStore,
    private readonly createVideoQueue: Queue<VideoMetadata>,
  ) {}

  createBaseVideoSections(spokenQuoteChunks: SpokenQuoteChunk[], fps: number): BaseVideoSection[] {
    const baseVideoSections: BaseVideoSection[] = [];

    for (let i = 0; i < spokenQuoteChunks.length; i++) {
      const spokenQuoteChunk = spokenQuoteChunks[i];
      const nextSpokenQuoteChunk = spokenQuoteChunks[i + 1];

      if (!nextSpokenQuoteChunk) {
        const durationInFrames = Math.ceil((spokenQuoteChunk.end - spokenQuoteChunk.start) / fps);
        const text = spokenQuoteChunk.value;
        baseVideoSections.push({ text, durationInFrames });
        continue;
      }

      const durationInFrames = Math.ceil((nextSpokenQuoteChunk.start - spokenQuoteChunk.start) / fps);
      const text = spokenQuoteChunk.value;
      baseVideoSections.push({ text, durationInFrames });
    }

    return baseVideoSections;
  }

  async execute(spokenQuote: SpokenQuote, fps: number): Promise<Result<Unit, NetworkError | UnknownError>> {
    return Result.ok();
  }
}

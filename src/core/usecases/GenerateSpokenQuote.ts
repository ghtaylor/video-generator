import { NetworkError } from "@core/errors/NetworkError";
import { UnknownError } from "@core/errors/UnknownError";
import { FileLocation, FileStore } from "@core/fileStore";
import { Queue } from "@core/queue";
import { SpeechService } from "@core/speechService";
import { Quote } from "@domain/Quote";
import { SpokenQuote, SpokenQuoteChunk } from "@domain/SpokenQuote";
import { Speech } from "@domain/Speech";
import { SpokenQuoteMarksInvalidError } from "@domain/errors/SpokenQuote";
import { Result, Unit } from "true-myth";

export class GenerateSpokenQuoteUseCase {
  constructor(
    private readonly speechService: SpeechService,
    private readonly fileStore: FileStore,
    private readonly spokenQuoteQueue: Queue<SpokenQuote>,
  ) {}

  createSpokenQuote(
    quote: Quote,
    speech: Speech,
    audioLocation: FileLocation,
  ): Result<SpokenQuote, SpokenQuoteMarksInvalidError> {
    const chunks: SpokenQuoteChunk[] = [];

    for (const chunk of quote.chunks) {
      const wordsOfChunk = chunk.replace(/[^a-zA-Z0-9\s']/g, "").split(" ");

      let start = 0;
      let end = 0;

      for (let i = 0; i < wordsOfChunk.length; i++) {
        const word = wordsOfChunk[i];

        if (word.toLowerCase() !== speech.marks[i].value.toLowerCase())
          return Result.err(new SpokenQuoteMarksInvalidError());

        if (i === 0) start = speech.marks[i].start;

        if (i === wordsOfChunk.length - 1) end = speech.marks[i].end;
      }

      speech.marks = speech.marks.slice(wordsOfChunk.length);

      chunks.push({
        value: chunk,
        start,
        end,
      });
    }

    return Result.ok({
      text: quote.text,
      chunks,
      audioLocation,
    });
  }

  async execute(quote: Quote): Promise<Result<Unit, SpokenQuoteMarksInvalidError | NetworkError | UnknownError>> {
    const speechResult = await this.speechService.generateSpeech(quote.text);
    if (speechResult.isErr) return Result.err(speechResult.error);
    const { value: speech } = speechResult;

    const storeAudioResult = await this.fileStore.store(speechResult.value.audio);
    if (storeAudioResult.isErr) return Result.err(storeAudioResult.error);
    const { value: audioLocation } = storeAudioResult;

    const spokenQuoteResult = this.createSpokenQuote(quote, speech, audioLocation);
    if (spokenQuoteResult.isErr) return Result.err(spokenQuoteResult.error);
    const { value: spokenQuote } = spokenQuoteResult;

    return this.spokenQuoteQueue.enqueue(spokenQuote);
  }
}

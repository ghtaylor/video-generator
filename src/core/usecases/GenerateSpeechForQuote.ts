import { NetworkError } from "@core/errors/NetworkError";
import { UnknownError } from "@core/errors/UnknownError";
import { FileLocation, FileStore } from "@core/fileStore";
import { Queue } from "@core/queue";
import { SpeechService } from "@core/speechService";
import { Quote } from "@domain/Quote";
import { QuoteWithSpeech, QuoteWithSpeechChunk } from "@domain/QuoteWithSpeech";
import { Speech } from "@domain/Speech";
import { QuoteSpeechMarksInvalidError } from "@domain/errors/QuoteWithSpeech";
import { Result, Unit } from "true-myth";

export class GenerateSpeechForQuoteUseCase {
  constructor(
    private readonly speechService: SpeechService,
    private readonly fileStore: FileStore,
    private readonly quoteWithSpeechQueue: Queue<QuoteWithSpeech>,
  ) {}

  createQuoteWithSpeech(
    quote: Quote,
    speech: Speech,
    audioLocation: FileLocation,
  ): Result<QuoteWithSpeech, QuoteSpeechMarksInvalidError> {
    const chunks: QuoteWithSpeechChunk[] = [];

    for (const chunk of quote.chunks) {
      const wordsOfChunk = chunk.replace(/[^a-zA-Z0-9\s']/g, "").split(" ");

      let start = 0;
      let end = 0;

      for (let i = 0; i < wordsOfChunk.length; i++) {
        const word = wordsOfChunk[i];

        if (word.toLowerCase() !== speech.marks[i].value.toLowerCase())
          return Result.err(new QuoteSpeechMarksInvalidError());

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

  async execute(quote: Quote): Promise<Result<Unit, QuoteSpeechMarksInvalidError | NetworkError | UnknownError>> {
    const speechResult = await this.speechService.generateSpeech(quote.text);
    if (speechResult.isErr) return Result.err(speechResult.error);
    const { value: speech } = speechResult;

    const storeAudioResult = await this.fileStore.store(speechResult.value.audio);
    if (storeAudioResult.isErr) return Result.err(storeAudioResult.error);
    const { value: audioLocation } = storeAudioResult;

    const quoteWithSpeechResult = this.createQuoteWithSpeech(quote, speech, audioLocation);
    if (quoteWithSpeechResult.isErr) return Result.err(quoteWithSpeechResult.error);
    const { value: quoteWithSpeech } = quoteWithSpeechResult;

    return this.quoteWithSpeechQueue.enqueue(quoteWithSpeech);
  }
}

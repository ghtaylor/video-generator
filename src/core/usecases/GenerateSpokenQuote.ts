import { NetworkError } from "@core/errors/NetworkError";
import { UnknownError } from "@core/errors/UnknownError";
import { FileLocation, FileStore } from "@core/fileStore";
import { Queue } from "@core/queue";
import { SpeechService } from "@core/speechService";
import { Quote } from "@domain/Quote";
import { Speech } from "@domain/Speech";
import { SpokenQuote, SpokenQuoteChunk } from "@domain/SpokenQuote";
import { SpokenQuoteMarksInvalidError } from "@domain/errors/SpokenQuote";
import { Result, ResultAsync, err, ok } from "neverthrow";

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

        if (word.toLowerCase() !== speech.marks[i].value.toLowerCase()) return err(new SpokenQuoteMarksInvalidError());

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

    return ok({
      text: quote.text,
      chunks,
      audioLocation,
    });
  }

  execute(quote: Quote): ResultAsync<SpokenQuote, SpokenQuoteMarksInvalidError | NetworkError | UnknownError> {
    return this.speechService
      .generateSpeech(quote.text)
      .andThen((speech) =>
        this.fileStore
          .store(speech.audio)
          .andThen((audioLocation) => this.createSpokenQuote(quote, speech, audioLocation)),
      )
      .andThen(this.spokenQuoteQueue.enqueue);
  }
}

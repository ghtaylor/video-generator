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
    endDelay: number = 1000,
  ): Result<SpokenQuote, SpokenQuoteMarksInvalidError> {
    const chunks: SpokenQuoteChunk[] = [];

    for (let chunkIndex = 0; chunkIndex < quote.chunks.length; chunkIndex++) {
      const chunk = quote.chunks[chunkIndex];
      const wordsOfChunk = chunk.replace(/[^a-zA-Z0-9\s']/g, "").split(" ");

      let start = 0;
      let end = 0;

      for (let wordIndex = 0; wordIndex < wordsOfChunk.length; wordIndex++) {
        const word = wordsOfChunk[wordIndex];

        if (word.toLowerCase() !== speech.marks[wordIndex].value.toLowerCase())
          return err(new SpokenQuoteMarksInvalidError());

        if (wordIndex === 0 && chunkIndex === 0) start = 0;
        else if (wordIndex === 0) start = speech.marks[wordIndex].time;

        if (wordIndex === wordsOfChunk.length - 1)
          end = speech.marks[wordIndex + 1]?.time ?? speech.marks[wordIndex].time + endDelay;
      }

      speech.marks = speech.marks.slice(wordsOfChunk.length);

      chunks.push({
        value: chunk,
        start,
        end,
      });
    }

    if (speech.marks.length > 0) return err(new SpokenQuoteMarksInvalidError());

    return ok({
      text: quote.text,
      chunks,
      audioLocation,
    });
  }

  private getSpeechAudioFileLocation(): FileLocation {
    return `speeches/${new Date().getTime()}.mp3`;
  }

  execute(quote: Quote): ResultAsync<SpokenQuote, SpokenQuoteMarksInvalidError | NetworkError | UnknownError> {
    return this.speechService
      .generateSpeech(quote.text)
      .andThen((speech) =>
        this.fileStore
          .store(this.getSpeechAudioFileLocation(), speech.audio)
          .andThen((audioLocation) => this.createSpokenQuote(quote, speech, audioLocation)),
      )
      .andThen(this.spokenQuoteQueue.enqueue);
  }
}

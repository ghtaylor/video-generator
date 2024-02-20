import { ParseError } from "@core/errors/ParseError";
import { ServiceError } from "@core/errors/ServiceError";
import { ValidationError } from "@core/errors/ValidationError";
import { FileStore } from "@core/fileStore";
import { ProgressReporter } from "@core/progressReporter";
import { SpeechService } from "@core/speechService";
import { FilePath } from "@video-generator/domain/File";
import { Quote, SpokenQuote, SpokenQuoteChunk } from "@video-generator/domain/Quote";
import { SpeechMark } from "@video-generator/domain/Speech";
import { SpokenQuoteSpeechMarksInvalidError } from "@video-generator/domain/errors/SpokenQuote";
import { Result, ResultAsync, err, ok } from "neverthrow";

export class GenerateSpokenQuoteUseCase {
  constructor(
    private readonly speechService: SpeechService,
    private readonly fileStore: FileStore,
    private readonly progressReporter: ProgressReporter,
  ) {}

  createSpokenQuote(
    quote: Quote,
    speechMarks: SpeechMark[],
    speechAudioPath: FilePath,
    endDelay: number = 2000,
  ): Result<SpokenQuote, SpokenQuoteSpeechMarksInvalidError> {
    const chunks: SpokenQuoteChunk[] = [];

    for (let chunkIndex = 0; chunkIndex < quote.chunks.length; chunkIndex++) {
      const chunk = quote.chunks[chunkIndex];
      const wordsOfChunk = chunk
        .replace(/[^a-zA-Z0-9\s'-]/g, "")
        .replace("-", " ")
        .split(" ");

      let start = 0;
      let end = 0;

      for (let wordIndex = 0; wordIndex < wordsOfChunk.length; wordIndex++) {
        const word = wordsOfChunk[wordIndex];

        if (word.toLowerCase() !== speechMarks[wordIndex]?.value.toLowerCase())
          return err(
            new SpokenQuoteSpeechMarksInvalidError(
              `Chunk word '${word.toLowerCase()} != Speech marks word '${speechMarks[wordIndex]?.value.toLowerCase()}'`,
              speechMarks,
              quote,
            ),
          );

        if (wordIndex === 0 && chunkIndex === 0) start = 0;
        else if (wordIndex === 0) start = speechMarks[wordIndex].time;

        if (wordIndex === wordsOfChunk.length - 1)
          end = speechMarks[wordIndex + 1]?.time ?? speechMarks[wordIndex].time + endDelay;
      }

      speechMarks = speechMarks.slice(wordsOfChunk.length);

      chunks.push({
        value: chunk,
        start,
        end,
      });
    }

    if (speechMarks.length > 0)
      return err(
        new SpokenQuoteSpeechMarksInvalidError(`Leftover speech marks: ${speechMarks.length}`, speechMarks, quote),
      );

    return ok({
      title: quote.title,
      text: quote.text,
      chunks,
      speechAudioPath,
    });
  }

  private getSpeechAudioFilePath(): FilePath {
    return `speeches/${new Date().getTime()}.mp3`;
  }

  execute(
    quote: Quote,
  ): ResultAsync<SpokenQuote, SpokenQuoteSpeechMarksInvalidError | ServiceError | ValidationError | ParseError> {
    return this.progressReporter
      .reportProgress({ state: "GENERATING_SPEECH", progress: 0.5 })
      .andThen(() =>
        this.speechService
          .generateSpeech(quote.text)
          .andThen((speech) =>
            this.fileStore
              .store(this.getSpeechAudioFilePath(), speech.audio)
              .andThen((audioPath) => this.createSpokenQuote(quote, speech.marks, audioPath)),
          ),
      );
  }
}

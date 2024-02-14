import { SpeechMark } from "../Speech";

export class SpokenQuoteMarksInvalidError extends Error {
  readonly name: string = "SpokenQuoteMarksInvalidError";

  constructor(
    readonly speechMarks: SpeechMark[],
    readonly quoteText: string,
  ) {
    super("Speech marks do not match quote text");
  }
}

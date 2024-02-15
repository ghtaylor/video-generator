import { Quote } from "Quote";
import { SpeechMark } from "../Speech";

export class SpokenQuoteMarksInvalidError extends Error {
  readonly name: string = "SpokenQuoteMarksInvalidError";

  constructor(
    message: string,
    readonly speechMarks: SpeechMark[],
    readonly quote: Quote,
  ) {
    super(`Speech marks do not match quote text (${message})`);
  }
}

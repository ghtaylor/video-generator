export class QuoteSpeechMarksInvalidError extends Error {
  name: string = "QuoteSpeechMarksInvalidError";

  constructor() {
    super("Speech marks do not match quote text");
  }
}

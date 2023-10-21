export class SpokenQuoteMarksInvalidError extends Error {
  readonly name: string = "SpokenQuoteMarksInvalidError";

  constructor() {
    super("Speech marks do not match quote text");
  }
}

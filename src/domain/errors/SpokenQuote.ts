export class SpokenQuoteMarksInvalidError extends Error {
  name: string = "SpokenQuoteMarksInvalidError";

  constructor() {
    super("Speech marks do not match quote text");
  }
}

import { FileStore } from "@core/fileStore";
import { Queue } from "@core/queue";
import { SpeechService } from "@core/speechService";
import { GenerateSpeechForQuoteUseCase } from "@core/usecases/GenerateSpeechForQuote";
import { Quote } from "@domain/Quote";
import { QuoteWithSpeech } from "@domain/QuoteWithSpeech";
import { Speech } from "@domain/Speech";
import { QuoteSpeechMarksInvalidError } from "@domain/errors/QuoteWithSpeech";
import { mock } from "jest-mock-extended";

const speechService = mock<SpeechService>();
const fileStore = mock<FileStore>();
const quoteWithSpeechQueue = mock<Queue<QuoteWithSpeech>>();

const generateSpeechForQuoteUseCase = new GenerateSpeechForQuoteUseCase(speechService, fileStore, quoteWithSpeechQueue);

describe("GenerateSpeechForQuote Use Case", () => {
  describe("`createQuoteWithSpeech`", () => {
    const audioLocation = "audioLocation";

    describe.each<[Quote, Speech, QuoteWithSpeech]>([
      [
        {
          text: "This is an example, a good one.",
          chunks: ["This is an example,", "a good one."],
        },
        {
          audio: Buffer.from("audio"),
          marks: [
            {
              value: "this",
              start: 0,
              end: 120,
            },
            {
              value: "is",
              start: 120,
              end: 240,
            },
            {
              value: "an",
              start: 240,
              end: 360,
            },
            {
              value: "example",
              start: 360,
              end: 480,
            },
            {
              value: "a",
              start: 490,
              end: 610,
            },
            {
              value: "good",
              start: 610,
              end: 730,
            },
            {
              value: "one",
              start: 730,
              end: 850,
            },
          ],
        },
        {
          text: "This is an example, a good one.",
          audioLocation: "audioLocation",
          chunks: [
            {
              value: "This is an example,",
              start: 0,
              end: 480,
            },
            {
              value: "a good one.",
              start: 490,
              end: 850,
            },
          ],
        },
      ],
      [
        {
          text: "This is an example, and there's an apostrophe.",
          chunks: ["This is an example,", "and there's an apostrophe."],
        },
        {
          audio: Buffer.from("audio"),
          marks: [
            {
              value: "this",
              start: 0,
              end: 120,
            },
            {
              value: "is",
              start: 120,
              end: 240,
            },
            {
              value: "an",
              start: 240,
              end: 360,
            },
            {
              value: "example",
              start: 360,
              end: 480,
            },
            {
              value: "and",
              start: 490,
              end: 610,
            },
            {
              value: "there's",
              start: 610,
              end: 730,
            },
            {
              value: "an",
              start: 730,
              end: 850,
            },
            {
              value: "apostrophe",
              start: 850,
              end: 970,
            },
          ],
        },
        {
          text: "This is an example, and there's an apostrophe.",
          audioLocation: "audioLocation",
          chunks: [
            {
              value: "This is an example,",
              start: 0,
              end: 480,
            },
            {
              value: "and there's an apostrophe.",
              start: 490,
              end: 970,
            },
          ],
        },
      ],
      [
        {
          text: "In this example, speech marks have bigger gaps.",
          chunks: ["In this example,", "speech marks have bigger gaps."],
        },
        {
          audio: Buffer.from("audio"),
          marks: [
            {
              value: "in",
              start: 0,
              end: 120,
            },
            {
              value: "this",
              start: 124,
              end: 244,
            },
            {
              value: "example",
              start: 248,
              end: 368,
            },
            {
              value: "speech",
              start: 372,
              end: 492,
            },
            {
              value: "marks",
              start: 496,
              end: 616,
            },
            {
              value: "have",
              start: 620,
              end: 740,
            },
            {
              value: "bigger",
              start: 744,
              end: 864,
            },
            {
              value: "gaps",
              start: 868,
              end: 988,
            },
          ],
        },
        {
          text: "In this example, speech marks have bigger gaps.",
          audioLocation: "audioLocation",
          chunks: [
            {
              value: "In this example,",
              start: 0,
              end: 368,
            },
            {
              value: "speech marks have bigger gaps.",
              start: 372,
              end: 988,
            },
          ],
        },
      ],
    ])("GIVEN a Quote and Speech that are valid", (quote, speech, expectedResult) => {
      test("THEN `createQuoteWithSpeech` should return a Result.ok with a QuoteWithSpeech", () => {
        const result = generateSpeechForQuoteUseCase.createQuoteWithSpeech(quote, speech, audioLocation);

        expect(result.isOk).toEqual(true);
        if (result.isOk) {
          expect(result.value).toEqual(expectedResult);
        }
      });
    });

    describe("GIVEN a Quote, but the Speech has marks that do not match the Quote", () => {
      const quote: Quote = {
        text: "This is an example, a good one.",
        chunks: ["This is an example,", "a good one."],
      };

      const speech: Speech = {
        audio: Buffer.from("audio"),
        marks: [
          {
            value: "this",
            start: 0,
            end: 120,
          },
          {
            value: "is",
            start: 120,
            end: 240,
          },
          {
            value: "a",
            start: 240,
            end: 360,
          },
          {
            value: "bad",
            start: 360,
            end: 480,
          },
          {
            value: "example",
            start: 480,
            end: 600,
          },
        ],
      };

      test("THEN `createQuoteWithSpeech` should return a Result.err with a QuoteSpeechMarksInvalidError", () => {
        const result = generateSpeechForQuoteUseCase.createQuoteWithSpeech(quote, speech, audioLocation);

        expect(result.isErr).toEqual(true);
        if (result.isErr) {
          expect(result.error).toBeInstanceOf(QuoteSpeechMarksInvalidError);
        }
      });
    });
  });
});

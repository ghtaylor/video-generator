import { FileStore } from "@core/fileStore";
import { Queue } from "@core/queue";
import { SpeechService } from "@core/speechService";
import { GenerateSpokenQuoteUseCase } from "@core/usecases/GenerateSpokenQuote";
import { Quote } from "@domain/Quote";
import { SpokenQuote } from "@domain/SpokenQuote";
import { Speech } from "@domain/Speech";
import { SpokenQuoteMarksInvalidError } from "@domain/errors/SpokenQuote";
import { mock } from "jest-mock-extended";

const speechService = mock<SpeechService>();
const fileStore = mock<FileStore>();
const spokenQuoteQueue = mock<Queue<SpokenQuote>>();

const generateSpokenQuoteUseCase = new GenerateSpokenQuoteUseCase(speechService, fileStore, spokenQuoteQueue);

describe("GenerateSpokenQuote Use Case", () => {
  describe("`createSpokenQuote`", () => {
    const audioLocation = "audioLocation";
    const endDelay = 1000;

    describe.each<[Quote, Speech, SpokenQuote]>([
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
              time: 0,
            },
            {
              value: "is",
              time: 120,
            },
            {
              value: "an",
              time: 240,
            },
            {
              value: "example",
              time: 360,
            },
            {
              value: "a",
              time: 490,
            },
            {
              value: "good",
              time: 610,
            },
            {
              value: "one",
              time: 730,
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
              end: 490,
            },
            {
              value: "a good one.",
              start: 490,
              end: 730 + endDelay,
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
              time: 0,
            },
            {
              value: "is",
              time: 120,
            },
            {
              value: "an",
              time: 240,
            },
            {
              value: "example",
              time: 360,
            },
            {
              value: "and",
              time: 490,
            },
            {
              value: "there's",
              time: 610,
            },
            {
              value: "an",
              time: 730,
            },
            {
              value: "apostrophe",
              time: 850,
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
              end: 490,
            },
            {
              value: "and there's an apostrophe.",
              start: 490,
              end: 850 + endDelay,
            },
          ],
        },
      ],
      [
        {
          text: "This is an example. Speech marks have capital letters.",
          chunks: ["This is an example.", "Speech marks have capital letters."],
        },
        {
          audio: Buffer.from("audio"),
          marks: [
            {
              value: "this",
              time: 0,
            },
            {
              value: "is",
              time: 120,
            },
            {
              value: "an",
              time: 240,
            },
            {
              value: "example",
              time: 360,
            },
            {
              value: "Speech",
              time: 490,
            },
            {
              value: "marks",
              time: 610,
            },
            {
              value: "have",
              time: 730,
            },
            {
              value: "Capital",
              time: 850,
            },
            {
              value: "letters",
              time: 970,
            },
          ],
        },
        {
          text: "This is an example. Speech marks have capital letters.",
          audioLocation: "audioLocation",
          chunks: [
            {
              value: "This is an example.",
              start: 0,
              end: 490,
            },
            {
              value: "Speech marks have capital letters.",
              start: 490,
              end: 970 + endDelay,
            },
          ],
        },
      ],
      [
        {
          text: "This is an example. Speech marks start later than zero.",
          chunks: ["This is an example.", "Speech marks start later than zero."],
        },
        {
          audio: Buffer.from("audio"),
          marks: [
            {
              value: "this",
              time: 10,
            },
            {
              value: "is",
              time: 120,
            },
            {
              value: "an",
              time: 240,
            },
            {
              value: "example",
              time: 360,
            },
            {
              value: "Speech",
              time: 490,
            },
            {
              value: "marks",
              time: 610,
            },
            {
              value: "start",
              time: 730,
            },
            {
              value: "later",
              time: 850,
            },
            {
              value: "than",
              time: 970,
            },
            {
              value: "zero",
              time: 1090,
            },
          ],
        },
        {
          text: "This is an example. Speech marks start later than zero.",
          audioLocation: "audioLocation",
          chunks: [
            {
              value: "This is an example.",
              start: 0,
              end: 490,
            },
            {
              value: "Speech marks start later than zero.",
              start: 490,
              end: 1090 + endDelay,
            },
          ],
        },
      ],
    ])("GIVEN a Quote and Speech that are valid", (quote, speech, expectedResult) => {
      test("THEN `createSpokenQuote` should return a Result.ok with a SpokenQuote", () => {
        const result = generateSpokenQuoteUseCase.createSpokenQuote(quote, speech, audioLocation, endDelay);

        expect(result._unsafeUnwrap()).toEqual(expectedResult);
      });
    });

    describe.each<[Quote, Speech]>([
      [
        {
          text: "This is an example, a bad one because the marks don't match.",
          chunks: ["This is an example,", "a bad one because the marks don't match."],
        },
        {
          audio: Buffer.from("audio"),
          marks: [
            {
              value: "this",
              time: 0,
            },
            {
              value: "is",
              time: 120,
            },
            {
              value: "a",
              time: 240,
            },
            {
              value: "bad",
              time: 360,
            },
            {
              value: "example",
              time: 490,
            },
          ],
        },
      ],
      [
        {
          text: "This is a bad example, because there are more marks than words.",
          chunks: ["This is a bad example,", "because there are more marks than words."],
        },
        {
          audio: Buffer.from("audio"),
          marks: [
            {
              value: "this",
              time: 0,
            },
            {
              value: "is",
              time: 120,
            },
            {
              value: "a",
              time: 240,
            },
            {
              value: "bad",
              time: 360,
            },
            {
              value: "example",
              time: 490,
            },
            {
              value: "because",
              time: 610,
            },
            {
              value: "there",
              time: 730,
            },
            {
              value: "are",
              time: 850,
            },
            {
              value: "more",
              time: 970,
            },
            {
              value: "marks",
              time: 1090,
            },
            {
              value: "than",
              time: 1210,
            },
            {
              value: "words",
              time: 1330,
            },
            {
              value: "see?",
              time: 1450,
            },
          ],
        },
      ],
    ])("GIVEN a Quote, but the Speech has marks that do not match the Quote", (quote, speech) => {
      test("THEN `createSpokenQuote` should return a Result.err with a SpokenQuoteMarksInvalidError", () => {
        const result = generateSpokenQuoteUseCase.createSpokenQuote(quote, speech, audioLocation, endDelay);

        expect(result._unsafeUnwrapErr()).toEqual(new SpokenQuoteMarksInvalidError());
      });
    });
  });
});

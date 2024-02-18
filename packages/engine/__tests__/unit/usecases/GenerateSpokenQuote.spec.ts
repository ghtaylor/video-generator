import { ServiceError } from "@core/errors/ServiceError";
import { FileStore } from "@core/fileStore";
import { SpeechService } from "@core/speechService";
import { GenerateSpokenQuoteUseCase } from "@core/usecases/GenerateSpokenQuote";
import { FilePath } from "@video-generator/domain/File";
import { Quote, SpokenQuote } from "@video-generator/domain/Quote";
import { Speech, SpeechMark } from "@video-generator/domain/Speech";
import { SpokenQuoteSpeechMarksInvalidError } from "@video-generator/domain/errors/SpokenQuote";
import { errAsync, okAsync } from "neverthrow";
import { mock } from "vitest-mock-extended";

describe("GenerateSpokenQuote Use Case - Unit Tests", () => {
  const speechService = mock<SpeechService>();
  const fileStore = mock<FileStore>();

  const generateSpokenQuoteUseCase = new GenerateSpokenQuoteUseCase(speechService, fileStore);

  describe("`createSpokenQuote`", () => {
    const VALID_SPEECH_AUDIO_FILE_PATH: FilePath = "speeches/1234567890.mp3";
    const END_DELAY = 1000;

    describe.each<[Quote, SpeechMark[], SpokenQuote]>([
      [
        {
          title: "A Title",
          text: "This is an example, a good one.",
          chunks: ["This is an example,", "a good one."],
        },
        [
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
        {
          title: "A Title",
          text: "This is an example, a good one.",
          speechAudioPath: VALID_SPEECH_AUDIO_FILE_PATH,
          chunks: [
            {
              value: "This is an example,",
              start: 0,
              end: 490,
            },
            {
              value: "a good one.",
              start: 490,
              end: 730 + END_DELAY,
            },
          ],
        },
      ],
      [
        {
          title: "A Title",
          text: "This is an example, and there's an apostrophe.",
          chunks: ["This is an example,", "and there's an apostrophe."],
        },
        [
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
        {
          title: "A Title",
          text: "This is an example, and there's an apostrophe.",
          speechAudioPath: VALID_SPEECH_AUDIO_FILE_PATH,
          chunks: [
            {
              value: "This is an example,",
              start: 0,
              end: 490,
            },
            {
              value: "and there's an apostrophe.",
              start: 490,
              end: 850 + END_DELAY,
            },
          ],
        },
      ],
      [
        {
          title: "A Title",
          text: "This is an example. Speech marks have capital letters.",
          chunks: ["This is an example.", "Speech marks have capital letters."],
        },
        [
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
        {
          title: "A Title",
          text: "This is an example. Speech marks have capital letters.",
          speechAudioPath: VALID_SPEECH_AUDIO_FILE_PATH,
          chunks: [
            {
              value: "This is an example.",
              start: 0,
              end: 490,
            },
            {
              value: "Speech marks have capital letters.",
              start: 490,
              end: 970 + END_DELAY,
            },
          ],
        },
      ],
      [
        {
          title: "A Title",
          text: "This is an example. Speech marks start later than zero.",
          chunks: ["This is an example.", "Speech marks start later than zero."],
        },
        [
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
        {
          title: "A Title",
          text: "This is an example. Speech marks start later than zero.",
          speechAudioPath: VALID_SPEECH_AUDIO_FILE_PATH,
          chunks: [
            {
              value: "This is an example.",
              start: 0,
              end: 490,
            },
            {
              value: "Speech marks start later than zero.",
              start: 490,
              end: 1090 + END_DELAY,
            },
          ],
        },
      ],
      [
        {
          title: "A Title",
          text: "This is an example. There are three chunks, yes, three!",
          chunks: ["This is an example.", "There are three chunks,", "yes, three!"],
        },
        [
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
            value: "There",
            time: 490,
          },
          {
            value: "are",
            time: 610,
          },
          {
            value: "three",
            time: 730,
          },
          {
            value: "chunks",
            time: 850,
          },
          {
            value: "yes",
            time: 1020,
          },
          {
            value: "three",
            time: 1100,
          },
        ],
        {
          title: "A Title",
          text: "This is an example. There are three chunks, yes, three!",
          speechAudioPath: VALID_SPEECH_AUDIO_FILE_PATH,
          chunks: [
            {
              value: "This is an example.",
              start: 0,
              end: 490,
            },
            {
              value: "There are three chunks,",
              start: 490,
              end: 1020,
            },
            {
              value: "yes, three!",
              start: 1020,
              end: 1100 + END_DELAY,
            },
          ],
        },
      ],
      [
        {
          title: "A Title",
          text: "This is an example. There are three chunks. With a hyphenated-word",
          chunks: ["This is an example.", "There are three chunks.", "With a hyphenated-word"],
        },
        [
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
            value: "There",
            time: 490,
          },
          {
            value: "are",
            time: 610,
          },
          {
            value: "three",
            time: 730,
          },
          {
            value: "chunks",
            time: 850,
          },
          {
            value: "with",
            time: 1020,
          },
          {
            value: "a",
            time: 1100,
          },
          {
            value: "hyphenated",
            time: 1150,
          },
          {
            value: "word",
            time: 1250,
          },
        ],
        {
          title: "A Title",
          text: "This is an example. There are three chunks. With a hyphenated-word",
          speechAudioPath: VALID_SPEECH_AUDIO_FILE_PATH,
          chunks: [
            {
              value: "This is an example.",
              start: 0,
              end: 490,
            },
            {
              value: "There are three chunks.",
              start: 490,
              end: 1020,
            },
            {
              value: "With a hyphenated-word",
              start: 1020,
              end: 1250 + END_DELAY,
            },
          ],
        },
      ],
    ])("GIVEN a Quote and SpeechMarks that are valid", (quote, speechMarks, expectedSpokenQuote) => {
      test("THEN `createSpokenQuote` should return a result with the SpokenQuote", () => {
        const result = generateSpokenQuoteUseCase.createSpokenQuote(
          quote,
          speechMarks,
          VALID_SPEECH_AUDIO_FILE_PATH,
          END_DELAY,
        );

        expect(result._unsafeUnwrap()).toEqual(expectedSpokenQuote);
      });
    });

    describe.each<[Quote, SpeechMark[]]>([
      [
        {
          title: "A Title",
          text: "This is an example, a bad one because the marks don't match.",
          chunks: ["This is an example,", "a bad one because the marks don't match."],
        },
        [
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
      ],
      [
        {
          title: "A Title",
          text: "This is a bad example, because there are more marks than words.",
          chunks: ["This is a bad example,", "because there are more marks than words."],
        },
        [
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
      ],
    ])("GIVEN a Quote, but the Speech has marks that do not match the Quote", (quote, speechMarks) => {
      test("THEN `createSpokenQuote` should return a result with a SpokenQuoteSpeechMarksInvalidError", () => {
        const result = generateSpokenQuoteUseCase.createSpokenQuote(
          quote,
          speechMarks,
          VALID_SPEECH_AUDIO_FILE_PATH,
          END_DELAY,
        );

        expect(result._unsafeUnwrapErr()).toBeInstanceOf(SpokenQuoteSpeechMarksInvalidError);
      });
    });
  });

  describe("WHEN the `execute` method is called", () => {
    const STORED_SPEECH_AUDIO_FILE_PATH: FilePath = "speeches/1234567890.mp3";

    const VALID_QUOTE: Quote = {
      title: "A Title",
      text: "This is an example, a good one.",
      chunks: ["This is an example,", "a good one."],
    };

    const VALID_SPEECH: Speech = {
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
    };

    describe("GIVEN all integrations are successful", () => {
      beforeEach(() => {
        speechService.generateSpeech.mockReturnValue(okAsync(VALID_SPEECH));
        fileStore.store.mockReturnValue(okAsync(STORED_SPEECH_AUDIO_FILE_PATH));
      });

      test("THEN `execute` should return a successful result", async () => {
        const result = await generateSpokenQuoteUseCase.execute(VALID_QUOTE);

        expect(result.isOk()).toBe(true);
      });

      describe("EXCEPT storing the Speech audio fails due to a ServiceError", () => {
        beforeEach(() => {
          fileStore.store.mockReturnValue(errAsync(new ServiceError("Failed to store speech audio.")));
        });

        test("THEN `execute` should return a ServiceError", async () => {
          const result = await generateSpokenQuoteUseCase.execute(VALID_QUOTE);

          expect(result._unsafeUnwrapErr()).toBeInstanceOf(ServiceError);
        });
      });

      describe("EXCEPT generating the Speech fails due to a ServiceError", () => {
        beforeEach(() => {
          speechService.generateSpeech.mockReturnValue(errAsync(new ServiceError("Failed to generate speech.")));
        });

        test("THEN `execute` should return a ServiceError", async () => {
          const result = await generateSpokenQuoteUseCase.execute(VALID_QUOTE);

          expect(result._unsafeUnwrapErr()).toBeInstanceOf(ServiceError);
        });
      });
    });
  });
});

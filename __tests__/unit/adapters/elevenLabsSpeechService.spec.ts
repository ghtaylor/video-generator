import { SpeechMark } from "@domain/Speech";
import { ElevenLabsSpeechService } from "@infrastructure/adapters/elevenLabs/elevenLabsSpeechService";
import { ElevenLabsNormalizedAlignment } from "@infrastructure/adapters/elevenLabs/schema";
import { ok } from "neverthrow";

const elevenLabsSpeechService = new ElevenLabsSpeechService();

type TestDescription = string;

describe("ElevenLabsSpeechService - Unit Tests", () => {
  describe("`speechMarksFrom` (NormalizedAlignment)", () => {
    describe.each<[TestDescription, ElevenLabsNormalizedAlignment, SpeechMark[]]>([
      [
        "WHEN `speechMarksFrom` is called with normalized alignment that has a leading space and a trailing period",
        {
          chars: [" ", "T", "h", "i", "s", " ", "i", "s", " ", "a", "n", " ", "e", "x", "a", "m", "p", "l", "e", "."],
          charStartTimesMs: [
            0, 35, 58, 174, 209, 267, 313, 348, 372, 395, 418, 488, 557, 615, 650, 673, 708, 743, 778, 836,
          ],
        },
        [
          {
            value: "this",
            time: 35,
          },
          {
            value: "is",
            time: 313,
          },
          {
            value: "an",
            time: 395,
          },
          {
            value: "example",
            time: 557,
          },
        ],
      ],
      [
        "WHEN `speechMarksFrom` is called with normalized alignment that has a leading space, a trailing period, and contains a comma",
        {
          chars: [
            " ",
            "T",
            "h",
            "i",
            "s",
            " ",
            "i",
            "s",
            ",",
            " ",
            "a",
            "n",
            " ",
            "e",
            "x",
            "a",
            "m",
            "p",
            "l",
            "e",
            ".",
          ],
          charStartTimesMs: [
            0, 35, 58, 174, 209, 267, 313, 348, 361, 372, 395, 418, 488, 557, 615, 650, 673, 708, 743, 778, 836,
          ],
        },
        [
          {
            value: "this",
            time: 35,
          },
          {
            value: "is",
            time: 313,
          },
          {
            value: "an",
            time: 395,
          },
          {
            value: "example",
            time: 557,
          },
        ],
      ],
      [
        "WHEN `speechMarksFrom` is called with normalized alignment that has a leading space, a trailing space, and contains a period",
        {
          chars: [
            " ",
            "T",
            "h",
            "i",
            "s",
            " ",
            "i",
            "s",
            " ",
            "a",
            "n",
            " ",
            "e",
            "x",
            "a",
            "m",
            "p",
            "l",
            "e",
            ".",
            " ",
          ],
          charStartTimesMs: [
            0, 35, 58, 174, 209, 267, 313, 348, 372, 395, 418, 488, 557, 615, 650, 673, 708, 743, 778, 836, 873,
          ],
        },
        [
          {
            value: "this",
            time: 35,
          },
          {
            value: "is",
            time: 313,
          },
          {
            value: "an",
            time: 395,
          },
          {
            value: "example",
            time: 557,
          },
        ],
      ],
      [
        "WHEN `speechMarksFrom` is called with normalized alignment that has no leading space and a trailing period",
        {
          chars: ["T", "h", "i", "s", " ", "i", "s", ",", " ", "a", "n", " ", "e", "x", "a", "m", "p", "l", "e", "."],
          charStartTimesMs: [
            0, 35, 58, 174, 209, 267, 313, 348, 361, 372, 395, 418, 488, 557, 615, 650, 673, 708, 743, 778,
          ],
        },
        [
          {
            value: "this",
            time: 0,
          },
          {
            value: "is",
            time: 267,
          },
          {
            value: "an",
            time: 372,
          },
          {
            value: "example",
            time: 488,
          },
        ],
      ],
      [
        "WHEN `speechMarksFrom` is called with normalized alignment that has a leading space, a trailing space, and contains a period, comma, exclamation mark, question mark, colon, and semicolon",
        {
          chars: [
            " ",
            "T",
            "h",
            "i",
            "s",
            ";",
            "!",
            " ",
            "i",
            "s",
            ",",
            ":",
            " ",
            "?",
            "a",
            "n",
            "!",
            " ",
            "e",
            "x",
            "a",
            "m",
            "p",
            "l",
            "e",
            ".",
          ],
          charStartTimesMs: [
            0, 35, 58, 174, 209, 267, 292, 313, 348, 361, 372, 376, 381, 395, 418, 488, 542, 557, 615, 650, 673, 708,
            743, 778, 836, 873,
          ],
        },
        [
          {
            value: "this",
            time: 35,
          },
          {
            value: "is",
            time: 348,
          },
          {
            value: "an",
            time: 418,
          },
          {
            value: "example",
            time: 615,
          },
        ],
      ],
    ])("%s", (_testDescription, normalizedAlignment, expectedSpeechMarks) => {
      test("THEN it should return the expected speech marks", () => {
        expect(elevenLabsSpeechService.speechMarksFrom(normalizedAlignment)).toEqual(ok(expectedSpeechMarks));
      });
    });
  });
});

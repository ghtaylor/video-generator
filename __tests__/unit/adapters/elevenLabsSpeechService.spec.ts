import { SpeechMark } from "@domain/Speech";
import { ElevenLabsClient } from "@infrastructure/adapters/elevenLabs/elevenLabsClient";
import { ElevenLabsSpeechService } from "@infrastructure/adapters/elevenLabs/elevenLabsSpeechService";
import { ElevenLabsNormalizedAlignment, ElevenLabsWSResponse } from "@infrastructure/adapters/elevenLabs/schema";
import { mock } from "jest-mock-extended";
import { ok } from "neverthrow";

const elevenLabsClient = mock<ElevenLabsClient>();
const elevenLabsSpeechService = new ElevenLabsSpeechService(elevenLabsClient);

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
        "WHEN `speechMarksFrom` is called with normalized alignment that has a leading space and a trailing space",
        {
          chars: [" ", "T", "h", "i", "s", " ", "i", "s", " ", "a", "n", " ", "e", "x", "a", "m", "p", "l", "e", " "],
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
        "WHEN `speechMarksFrom` is called with normalized alignment that has a leading space",
        {
          chars: [" ", "T", "h", "i", "s", " ", "i", "s", " ", "a", "n", " ", "e", "x", "a", "m", "p", "l", "e"],
          charStartTimesMs: [0, 35, 58, 174, 209, 267, 313, 348, 372, 395, 418, 488, 557, 615, 650, 673, 708, 743, 778],
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
      [
        "WHEN `speechMarksFrom` is called with normalized alignment that has a leading space, a trailing space, and contains an apostrophe",
        {
          chars: [
            " ",
            "D",
            "o",
            "n",
            "'",
            "t",
            " ",
            "w",
            "o",
            "r",
            "r",
            "y",
            " ",
            "a",
            "b",
            "o",
            "u",
            "t",
            " ",
            "i",
            "t",
            " ",
          ],
          charStartTimesMs: [
            0, 35, 58, 174, 209, 267, 313, 348, 372, 395, 418, 488, 557, 615, 650, 673, 708, 743, 778, 836, 873, 908,
          ],
        },
        [
          {
            value: "don't",
            time: 35,
          },
          {
            value: "worry",
            time: 348,
          },
          {
            value: "about",
            time: 615,
          },
          {
            value: "it",
            time: 836,
          },
        ],
      ],
    ])("%s", (_testDescription, normalizedAlignment, expectedSpeechMarks) => {
      test("THEN it should return the expected speech marks", () => {
        expect(elevenLabsSpeechService.speechMarksFrom(normalizedAlignment)).toEqual(ok(expectedSpeechMarks));
      });
    });
  });

  describe("`normalizedAlignmentFrom (ElevenLabsWSResponse[])`", () => {
    const ESTIMATED_GAP_MS = 90;

    describe.each<[TestDescription, ElevenLabsWSResponse[], ElevenLabsNormalizedAlignment]>([
      ["WHEN `normalizedAlignmentFrom` is called with an empty array", [], { chars: [], charStartTimesMs: [] }],
      [
        "WHEN `normalizedAlignmentFrom` is called with web socket responses that contain one normalized alignment",
        [
          {
            isFinal: null,
            audio: "",
            normalizedAlignment: {
              chars: ["T", "h", "i", "s", " ", "i", "s", " ", "a", "n", " ", "e", "x", "a", "m", "p", "l", "e"],
              charStartTimesMs: [0, 35, 58, 174, 209, 267, 313, 348, 372, 395, 418, 488, 557, 615, 650, 673, 708, 743],
            },
          },
          {
            isFinal: true,
            audio: null,
          },
        ],
        {
          chars: ["T", "h", "i", "s", " ", "i", "s", " ", "a", "n", " ", "e", "x", "a", "m", "p", "l", "e"],
          charStartTimesMs: [0, 35, 58, 174, 209, 267, 313, 348, 372, 395, 418, 488, 557, 615, 650, 673, 708, 743],
        },
      ],
      [
        "WHEN `normalizedAlignmentFrom` is called with web socket responses that contain two normalized alignments that are consecutive",
        [
          {
            isFinal: null,
            audio: "",
            normalizedAlignment: {
              chars: [
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
                ",",
                " ",
              ],
              charStartTimesMs: [
                0, 35, 58, 174, 209, 267, 313, 348, 372, 395, 418, 488, 557, 615, 650, 673, 708, 743, 778, 836,
              ],
            },
          },
          {
            isFinal: null,
            audio: "",
            normalizedAlignment: {
              chars: ["a", " ", "b", "i", "g", " ", "o", "n", "e", ".", " "],
              charStartTimesMs: [0, 20, 43, 58, 90, 121, 134, 159, 183, 205, 220],
            },
          },
          {
            isFinal: true,
            audio: null,
          },
        ],
        {
          chars: [
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
            ",",
            " ",
            "a",
            " ",
            "b",
            "i",
            "g",
            " ",
            "o",
            "n",
            "e",
            ".",
            " ",
          ],
          charStartTimesMs: [
            0,
            35,
            58,
            174,
            209,
            267,
            313,
            348,
            372,
            395,
            418,
            488,
            557,
            615,
            650,
            673,
            708,
            743,
            778,
            836,
            836 + ESTIMATED_GAP_MS,
            836 + ESTIMATED_GAP_MS + 20,
            836 + ESTIMATED_GAP_MS + 43,
            836 + ESTIMATED_GAP_MS + 58,
            836 + ESTIMATED_GAP_MS + 90,
            836 + ESTIMATED_GAP_MS + 121,
            836 + ESTIMATED_GAP_MS + 134,
            836 + ESTIMATED_GAP_MS + 159,
            836 + ESTIMATED_GAP_MS + 183,
            836 + ESTIMATED_GAP_MS + 205,
            836 + ESTIMATED_GAP_MS + 220,
          ],
        },
      ],
      [
        "WHEN `normalizedAlignmentFrom` is called with web socket responses that contain two normalized alignments that are separated by a response with no normalized alignment",
        [
          {
            isFinal: null,
            audio: "",
            normalizedAlignment: {
              chars: [
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
                ",",
                " ",
              ],
              charStartTimesMs: [
                0, 35, 58, 174, 209, 267, 313, 348, 372, 395, 418, 488, 557, 615, 650, 673, 708, 743, 778, 836,
              ],
            },
          },
          {
            isFinal: null,
            audio: "",
            normalizedAlignment: null,
          },
          {
            isFinal: null,
            audio: "",
            normalizedAlignment: {
              chars: ["a", " ", "b", "i", "g", " ", "o", "n", "e", ".", " "],
              charStartTimesMs: [0, 20, 43, 58, 90, 121, 134, 159, 183, 205, 220],
            },
          },
          {
            isFinal: true,
            audio: null,
          },
        ],
        {
          chars: [
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
            ",",
            " ",
            "a",
            " ",
            "b",
            "i",
            "g",
            " ",
            "o",
            "n",
            "e",
            ".",
            " ",
          ],
          charStartTimesMs: [
            0,
            35,
            58,
            174,
            209,
            267,
            313,
            348,
            372,
            395,
            418,
            488,
            557,
            615,
            650,
            673,
            708,
            743,
            778,
            836,
            836 + ESTIMATED_GAP_MS,
            836 + ESTIMATED_GAP_MS + 20,
            836 + ESTIMATED_GAP_MS + 43,
            836 + ESTIMATED_GAP_MS + 58,
            836 + ESTIMATED_GAP_MS + 90,
            836 + ESTIMATED_GAP_MS + 121,
            836 + ESTIMATED_GAP_MS + 134,
            836 + ESTIMATED_GAP_MS + 159,
            836 + ESTIMATED_GAP_MS + 183,
            836 + ESTIMATED_GAP_MS + 205,
            836 + ESTIMATED_GAP_MS + 220,
          ],
        },
      ],
    ])("%s", (_testDescription, responses, expectedNormalizedAlignment) => {
      test("THEN it should return the expected normalized alignment", () => {
        expect(elevenLabsSpeechService.normalizedAlignmentFrom(responses, ESTIMATED_GAP_MS)).toEqual(
          ok(expectedNormalizedAlignment),
        );
      });
    });
  });
});

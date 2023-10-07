import { PollyClient } from "@aws-sdk/client-polly";
import { SpeechMark } from "@domain/Speech";
import { PollySpeechService } from "@infrastructure/adapters/pollySpeechService";
import { mock } from "jest-mock-extended";
import { ok } from "neverthrow";

const pollyClient = mock<PollyClient>();

const pollySpeechService = new PollySpeechService(pollyClient);

describe("PollySpeechService - Unit Tests", () => {
  describe("`parseSpeechMarks`", () => {
    describe.each<[string, SpeechMark[]]>([
      [
        `{"time":6,"type":"word","start":0,"end":5,"value":"Hello"}
        {"time":732,"type":"word","start":7,"end":12,"value":"world"}`,
        [
          {
            value: "Hello",
            start: 0,
            end: 5,
          },
          {
            value: "world",
            start: 7,
            end: 12,
          },
        ],
      ],
      [
        `
        
        {"time":6,"type":"word","start":0,"end":5,"value":"Hello"}
        {"time":732,"type":"word","start":7,"end":12,"value":"world"}
        
        `,
        [
          {
            value: "Hello",
            start: 0,
            end: 5,
          },
          {
            value: "world",
            start: 7,
            end: 12,
          },
        ],
      ],
      [
        `{"time":6,"type":"word","start":0,"end":5,"value":"Hello"}
        {"time":732,"type":"word","start":7,"end":12,"value":"world"}
        {"time":732,"type":"word","start":14,"end":19,"value":"This"}
        {"time":732,"type":"word","start":21,"end":26,"value":"is"}
        {"time":732,"type":"word","start":28,"end":33,"value":"a"}
        {"time":732,"type":"word","start":35,"end":40,"value":"long"}
        {"time":732,"type":"word","start":42,"end":47,"value":"sentence"}`,
        [
          {
            value: "Hello",
            start: 0,
            end: 5,
          },
          {
            value: "world",
            start: 7,
            end: 12,
          },
          {
            value: "This",
            start: 14,
            end: 19,
          },
          {
            value: "is",
            start: 21,
            end: 26,
          },
          {
            value: "a",
            start: 28,
            end: 33,
          },
          {
            value: "long",
            start: 35,
            end: 40,
          },
          {
            value: "sentence",
            start: 42,
            end: 47,
          },
        ],
      ],
    ])("GIVEN a valid Polly speech marks response", (rawSpeechMarks, expectedSpeechMarks) => {
      describe("WHEN `parseSpeechMarks` is called", () => {
        it("THEN it should return the expected speech marks", () => {
          expect(pollySpeechService.parseSpeechMarks(rawSpeechMarks)).toEqual(ok(expectedSpeechMarks));
        });
      });
    });
  });
});

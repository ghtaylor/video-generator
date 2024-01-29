import { PollyClient } from "@aws-sdk/client-polly";
import { SpeechMark } from "@video-generator/domain/Speech";
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
            time: 6,
          },
          {
            value: "world",
            time: 732,
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
            time: 6,
          },
          {
            value: "world",
            time: 732,
          },
        ],
      ],
      [
        `{"time":6,"type":"word","start":0,"end":5,"value":"Hello"}
        {"time":732,"type":"word","start":7,"end":12,"value":"world"}
        {"time":1500,"type":"word","start":14,"end":19,"value":"This"}
        {"time":2000,"type":"word","start":21,"end":26,"value":"is"}
        {"time":2500,"type":"word","start":28,"end":33,"value":"a"}
        {"time":3000,"type":"word","start":35,"end":40,"value":"long"}
        {"time":3500,"type":"word","start":42,"end":47,"value":"sentence"}`,
        [
          {
            value: "Hello",
            time: 6,
          },
          {
            value: "world",
            time: 732,
          },
          {
            value: "This",
            time: 1500,
          },
          {
            value: "is",
            time: 2000,
          },
          {
            value: "a",
            time: 2500,
          },
          {
            value: "long",
            time: 3000,
          },
          {
            value: "sentence",
            time: 3500,
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

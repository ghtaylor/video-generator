import { PollyClient, SynthesizeSpeechCommandOutput } from "@aws-sdk/client-polly";
import { NetworkError } from "@core/errors/NetworkError";
import { ValidationError } from "@core/errors/ValidationError";
import { PollySpeechService } from "@infrastructure/adapters/pollySpeechService";
import { mock, mockDeep } from "jest-mock-extended";
import { err, ok } from "neverthrow";
import type { PartialDeep } from "type-fest";

const pollyClient = mockDeep<PollyClient>();

const pollySpeechService = new PollySpeechService(pollyClient);

describe("PollySpeechService - Integration Tests", () => {
  describe("GIVEN the PollyClient responds for an MP3 request", () => {
    describe("AND the AudioStream in the response is valid", () => {
      const response: PartialDeep<SynthesizeSpeechCommandOutput> = {
        ContentType: "audio/mpeg",
        AudioStream: {
          transformToByteArray: async () => new Uint8Array([1, 2, 3]),
        },
      };

      beforeEach(() => {
        pollyClient.send.mockResolvedValue(response as never);
      });

      describe("WHEN `getSpeechAudio` is called", () => {
        const text = "Hello world";

        test("THEN it should return the audio", async () => {
          await expect(pollySpeechService.getSpeechAudio(text)).resolves.toEqual(ok(Buffer.from([1, 2, 3])));
        });
      });
    });

    describe("AND the AudioStream in the response is undefined", () => {
      const response: PartialDeep<SynthesizeSpeechCommandOutput> = {
        ContentType: "audio/mpeg",
      };

      beforeEach(() => {
        pollyClient.send.mockResolvedValue(response as never);
      });

      describe("WHEN `getSpeechAudio` is called", () => {
        const text = "Hello world";

        test("THEN it should return a ValidationError", async () => {
          await expect(pollySpeechService.getSpeechAudio(text)).resolves.toEqual(
            err(new ValidationError("Audio stream is empty")),
          );
        });
      });
    });

    describe("AND the AudioStream throws an Error when transforming to a byte array", () => {
      const response: PartialDeep<SynthesizeSpeechCommandOutput> = {
        ContentType: "audio/mpeg",
        AudioStream: {
          transformToByteArray: async () => {
            throw new Error("Transform error");
          },
        },
      };

      beforeEach(() => {
        pollyClient.send.mockResolvedValue(response as never);
      });

      describe("WHEN `getSpeechAudio` is called", () => {
        const text = "Hello world";

        test("THEN it should return a ValidationError", async () => {
          await expect(pollySpeechService.getSpeechAudio(text)).resolves.toEqual(
            err(new ValidationError("Audio stream is invalid", new Error("Transform error"))),
          );
        });
      });
    });
  });

  describe("GIVEN the PollyClient responds for a JSON (Speech Marks) request", () => {
    describe("AND the AudioStream in the response is valid", () => {
      const audioStreamByteArray = new TextEncoder().encode(
        `{"time":6,"type":"word","start":0,"end":5,"value":"Hello"}
            {"time":732,"type":"word","start":7,"end":12,"value":"world"}`,
      );

      const response: PartialDeep<SynthesizeSpeechCommandOutput> = {
        ContentType: "application/x-json-stream",
        AudioStream: {
          transformToByteArray: async () => audioStreamByteArray,
        },
      };

      beforeEach(() => {
        pollyClient.send.mockResolvedValue(response as never);
      });

      describe("WHEN `getSpeechMarks` is called", () => {
        const text = "Hello world";

        test("THEN it should return the SpeechMarks", async () => {
          await expect(pollySpeechService.getSpeechMarks(text)).resolves.toEqual(
            ok([
              {
                start: 0,
                end: 5,
                value: "Hello",
              },
              {
                start: 7,
                end: 12,
                value: "world",
              },
            ]),
          );
        });
      });
    });

    describe("AND the AudioStream in the response is undefined", () => {
      const response: PartialDeep<SynthesizeSpeechCommandOutput> = {
        ContentType: "application/x-json-stream",
      };

      beforeEach(() => {
        pollyClient.send.mockResolvedValue(response as never);
      });

      describe("WHEN `getSpeechMarks` is called", () => {
        const text = "Hello world";

        test("THEN it should return a ValidationError", async () => {
          await expect(pollySpeechService.getSpeechMarks(text)).resolves.toEqual(
            err(new ValidationError("Audio stream is empty")),
          );
        });
      });
    });

    describe("AND the AudioStream throws an Error when transforming to a byte array", () => {
      const response: PartialDeep<SynthesizeSpeechCommandOutput> = {
        ContentType: "application/x-json-stream",
        AudioStream: {
          transformToByteArray: async () => {
            throw new Error("Transform error");
          },
        },
      };

      beforeEach(() => {
        pollyClient.send.mockResolvedValue(response as never);
      });

      describe("WHEN `getSpeechMarks` is called", () => {
        const text = "Hello world";

        test("THEN it should return a ValidationError", async () => {
          await expect(pollySpeechService.getSpeechMarks(text)).resolves.toEqual(
            err(new ValidationError("Audio stream is invalid", new Error("Transform error"))),
          );
        });
      });
    });
  });

  describe("GIVEN the PollyClient throws an Error when sending a SynthesizeSpeechCommand", () => {
    const pollyClientError = new Error("Polly error");

    beforeEach(() => {
      pollyClient.send.mockRejectedValue(pollyClientError as never);
    });

    describe("WHEN `getSpeechAudio` is called", () => {
      const text = "Hello world";

      test("THEN it should return a NetworkError", async () => {
        await expect(pollySpeechService.getSpeechAudio(text)).resolves.toEqual(
          err(new NetworkError("Polly API error", pollyClientError)),
        );
      });
    });

    describe("WHEN `getSpeechMarks` is called", () => {
      const text = "Hello world";

      test("THEN it should return a NetworkError", async () => {
        await expect(pollySpeechService.getSpeechMarks(text)).resolves.toEqual(
          err(new NetworkError("Polly API error", pollyClientError)),
        );
      });
    });
  });
});

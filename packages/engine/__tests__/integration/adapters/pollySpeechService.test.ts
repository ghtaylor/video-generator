import { PollyClient, SynthesizeSpeechCommand, SynthesizeSpeechCommandOutput } from "@aws-sdk/client-polly";
import { ServiceError } from "@core/errors/ServiceError";
import { ParseError } from "@core/errors/ParseError";
import { ValidationError } from "@core/errors/ValidationError";
import { PollySpeechService } from "@infrastructure/adapters/pollySpeechService";
import { mockDeep } from "vitest-mock-extended";
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
          const result = await pollySpeechService.getSpeechAudio(text);
          expect(result._unsafeUnwrapErr()).toBeInstanceOf(ValidationError);
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
                time: 6,
                value: "Hello",
              },
              {
                time: 732,
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
          const result = await pollySpeechService.getSpeechMarks(text);
          expect(result._unsafeUnwrapErr()).toBeInstanceOf(ValidationError);
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
          const result = await pollySpeechService.getSpeechMarks(text);
          expect(result._unsafeUnwrapErr()).toBeInstanceOf(ValidationError);
        });
      });
    });

    describe("AND the AudioStream in the response is not valid JSON", () => {
      const response: PartialDeep<SynthesizeSpeechCommandOutput> = {
        ContentType: "application/x-json-stream",
        AudioStream: {
          transformToByteArray: async () => new Uint8Array([1, 2, 3]),
        },
      };

      beforeEach(() => {
        pollyClient.send.mockResolvedValue(response as never);
      });

      describe("WHEN `getSpeechMarks` is called", () => {
        const text = "Hello world";

        test("THEN it should return a ParseError", async () => {
          const result = await pollySpeechService.getSpeechMarks(text);
          expect(result._unsafeUnwrapErr()).toBeInstanceOf(ParseError);
        });
      });
    });

    describe("AND the AudioStream in the response is valid JSON, but not valid SpeechMarks", () => {
      const response: PartialDeep<SynthesizeSpeechCommandOutput> = {
        ContentType: "application/x-json-stream",
        AudioStream: {
          transformToByteArray: async () => new TextEncoder().encode(`{"invalid":"speechmark"}`),
        },
      };

      beforeEach(() => {
        pollyClient.send.mockResolvedValue(response as never);
      });

      describe("WHEN `getSpeechMarks` is called", () => {
        const text = "Hello world";

        test("THEN it should return a ParseError", async () => {
          const result = await pollySpeechService.getSpeechMarks(text);
          expect(result._unsafeUnwrapErr()).toBeInstanceOf(ParseError);
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

      test("THEN it should return a ServiceError", async () => {
        const result = await pollySpeechService.getSpeechAudio(text);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ServiceError);
      });
    });

    describe("WHEN `getSpeechMarks` is called", () => {
      const text = "Hello world";

      test("THEN it should return a ServiceError", async () => {
        const result = await pollySpeechService.getSpeechAudio(text);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ServiceError);
      });
    });

    describe("WHEN `generateSpeech` is called", () => {
      const text = "Hello world";

      test("THEN it should return a ServiceError", async () => {
        const result = await pollySpeechService.getSpeechAudio(text);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ServiceError);
      });
    });
  });

  describe("GIVEN the PollyClient responds for an MP3 request and a JSON (Speech Marks) request", () => {
    const jsonSpeechMarksByteArray = new TextEncoder().encode(
      `{"time":6,"type":"word","start":0,"end":5,"value":"Hello"}
            {"time":732,"type":"word","start":7,"end":12,"value":"world"}`,
    );

    const mp3AudioStreamByteArray = new Uint8Array([1, 2, 3]);

    beforeEach(() => {
      pollyClient.send.mockImplementation(async (command) => {
        const _command = command as SynthesizeSpeechCommand;
        if (_command.input.OutputFormat === "mp3") {
          return {
            ContentType: "audio/mpeg",
            AudioStream: {
              transformToByteArray: async () => mp3AudioStreamByteArray,
            },
          };
        }
        return {
          ContentType: "application/x-json-stream",
          AudioStream: {
            transformToByteArray: async () => jsonSpeechMarksByteArray,
          },
        };
      });
    });

    describe("WHEN `generateSpeech` is called", () => {
      const text = "Hello world";

      test("THEN it should return the Speech", async () => {
        await expect(pollySpeechService.generateSpeech(text)).resolves.toEqual(
          ok({
            audio: Buffer.from(mp3AudioStreamByteArray),
            marks: [
              {
                time: 6,
                value: "Hello",
              },
              {
                time: 732,
                value: "world",
              },
            ],
          }),
        );
      });
    });
  });
});

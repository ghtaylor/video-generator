import { PollyClient } from "@aws-sdk/client-polly";
import { NetworkError } from "@core/errors/NetworkError";
import { ParseError } from "@core/errors/ParseError";
import { UnknownError } from "@core/errors/UnknownError";
import { SpeechService } from "@core/speechService";
import { Speech, SpeechMark } from "@domain/Speech";
import { Result, ResultAsync, fromThrowable } from "neverthrow";

export class PollySpeechService implements SpeechService {
  constructor(private readonly pollyClient: PollyClient) {}

  parseSpeechMarks(rawSpeechMarks: string): Result<SpeechMark[], ParseError> {
    return fromThrowable(
      () =>
        rawSpeechMarks
          .trim()
          .split("\n")
          .map((rawSpeechMark) => SpeechMark.parse(JSON.parse(rawSpeechMark))),
      (error) => new ParseError("Invalid SpeechMarks provided by Polly", error instanceof Error ? error : undefined),
    )();
  }

  getSpeechMarks(text: string): ResultAsync<string, NetworkError | UnknownError> {
    throw new Error("Method not implemented.");
  }

  getSpeechAudio(text: string): ResultAsync<Buffer, NetworkError | UnknownError> {
    throw new Error("Method not implemented.");
  }

  generateSpeech(text: string): ResultAsync<Speech, UnknownError | NetworkError> {
    throw new Error("Method not implemented.");
  }
}

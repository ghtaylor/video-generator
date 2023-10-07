import { PollyClient, SynthesizeSpeechCommand, SynthesizeSpeechCommandOutput } from "@aws-sdk/client-polly";
import { NetworkError } from "@core/errors/NetworkError";
import { ParseError } from "@core/errors/ParseError";
import { UnknownError } from "@core/errors/UnknownError";
import { ValidationError } from "@core/errors/ValidationError";
import { SpeechService } from "@core/speechService";
import { Speech, SpeechMark } from "@domain/Speech";
import { Result, ResultAsync, err, errAsync, fromPromise, fromThrowable, ok } from "neverthrow";

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

  private sendPollyCommand(command: SynthesizeSpeechCommand): ResultAsync<SynthesizeSpeechCommandOutput, NetworkError> {
    return fromPromise(
      this.pollyClient.send(command),
      (error) => new NetworkError("Polly API error", error instanceof Error ? error : undefined),
    );
  }

  private getBufferFromAudioStream(
    audioStream?: SynthesizeSpeechCommandOutput["AudioStream"],
  ): ResultAsync<Buffer, ValidationError> {
    if (audioStream === undefined) return errAsync(new ValidationError("Audio stream is empty"));

    return fromPromise(
      audioStream.transformToByteArray(),
      (error) => new ValidationError("Audio stream is invalid", error instanceof Error ? error : undefined),
    ).map((byteArray) => Buffer.from(byteArray));
  }

  getSpeechMarks(text: string): ResultAsync<SpeechMark[], NetworkError | ValidationError> {
    const command = new SynthesizeSpeechCommand({
      OutputFormat: "json",
      SpeechMarkTypes: ["word"],
      Text: text,
      VoiceId: "Joanna",
    });

    return this.sendPollyCommand(command)
      .map((response) => response.AudioStream)
      .andThen(this.getBufferFromAudioStream)
      .map((audioBuffer) => audioBuffer.toString("utf-8"))
      .andThen(this.parseSpeechMarks);
  }

  getSpeechAudio(text: string): ResultAsync<Buffer, NetworkError | ValidationError> {
    const command = new SynthesizeSpeechCommand({
      OutputFormat: "mp3",
      Text: text,
      VoiceId: "Joanna",
    });

    return this.sendPollyCommand(command)
      .map((response) => response.AudioStream)
      .andThen(this.getBufferFromAudioStream);
  }

  generateSpeech(text: string): ResultAsync<Speech, UnknownError | NetworkError> {
    throw new Error("Method not implemented.");
  }
}

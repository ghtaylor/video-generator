import { PollyClient, SynthesizeSpeechCommand, SynthesizeSpeechCommandOutput } from "@aws-sdk/client-polly";
import { ServiceError } from "@core/errors/ServiceError";
import { ParseError } from "@core/errors/ParseError";
import { ValidationError } from "@core/errors/ValidationError";
import { SpeechService } from "@core/speechService";
import { Speech, SpeechMark } from "@video-generator/domain/Speech";
import { Result, ResultAsync, errAsync, fromPromise, fromThrowable } from "neverthrow";

export class PollySpeechService implements SpeechService {
  constructor(private readonly pollyClient: PollyClient) {}

  parseSpeechMarks(rawSpeechMarks: string): Result<SpeechMark[], ParseError> {
    return fromThrowable(
      () =>
        rawSpeechMarks
          .trim()
          .split("\n")
          .map((rawSpeechMark) => SpeechMark.parse(JSON.parse(rawSpeechMark))),
      (error) => new ParseError("Invalid SpeechMarks provided by Polly", { originalError: error }),
    )();
  }

  private sendPollyCommand(command: SynthesizeSpeechCommand): ResultAsync<SynthesizeSpeechCommandOutput, ServiceError> {
    return fromPromise(
      this.pollyClient.send(command),
      (error) => new ServiceError("Polly API error", { originalError: error }),
    );
  }

  private getBufferFromAudioStream(
    audioStream?: SynthesizeSpeechCommandOutput["AudioStream"],
  ): ResultAsync<Buffer, ValidationError> {
    if (audioStream === undefined) return errAsync(new ValidationError("Audio stream is empty"));

    return fromPromise(
      audioStream.transformToByteArray(),
      (error) => new ValidationError("Audio stream is invalid", { originalError: error }),
    ).map((byteArray) => Buffer.from(byteArray));
  }

  getSpeechMarks(text: string): ResultAsync<SpeechMark[], ServiceError | ParseError | ValidationError> {
    const command = new SynthesizeSpeechCommand({
      OutputFormat: "json",
      SpeechMarkTypes: ["word"],
      Text: text,
      VoiceId: "Stephen",
      Engine: "neural",
    });

    return this.sendPollyCommand(command)
      .map((response) => response.AudioStream)
      .andThen(this.getBufferFromAudioStream)
      .map((audioBuffer) => audioBuffer.toString("utf-8"))
      .andThen(this.parseSpeechMarks);
  }

  getSpeechAudio(text: string): ResultAsync<Buffer, ServiceError | ValidationError> {
    const command = new SynthesizeSpeechCommand({
      OutputFormat: "mp3",
      Text: text,
      VoiceId: "Stephen",
      Engine: "neural",
    });

    return this.sendPollyCommand(command)
      .map((response) => response.AudioStream)
      .andThen(this.getBufferFromAudioStream);
  }

  generateSpeech(text: string): ResultAsync<Speech, ServiceError | ValidationError | ParseError> {
    return ResultAsync.combine([this.getSpeechAudio(text), this.getSpeechMarks(text)]).map(([audio, marks]) => ({
      audio,
      marks,
    }));
  }
}

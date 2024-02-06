import { ServiceError } from "@core/errors/ServiceError";
import { ParseError } from "@core/errors/ParseError";
import { ValidationError } from "@core/errors/ValidationError";
import { SpeechService } from "@core/speechService";
import { ElevenLabsClient } from "@infrastructure/adapters/elevenLabs/elevenLabsClient";
import { ElevenLabsNormalizedAlignment, ElevenLabsWSResponse } from "@infrastructure/adapters/elevenLabs/schema";
import { Speech, SpeechMark } from "@video-generator/domain/Speech";
import { Result, ResultAsync, ok } from "neverthrow";

export class ElevenLabsSpeechService implements SpeechService {
  constructor(private readonly client: ElevenLabsClient) {}

  speechMarksFrom({ chars, charStartTimesMs }: ElevenLabsNormalizedAlignment): Result<SpeechMark[], never> {
    function isLetter(char: string): boolean {
      return /[A-Za-z']/.test(char);
    }

    const speechMarks: SpeechMark[] = [];

    let word = "";
    let time = 0;

    for (let i = 0; i < chars.length; i++) {
      const currentChar = chars[i];
      const previousChar = chars[i - 1];
      const isLastChar = i === chars.length - 1;

      if (isLastChar && isLetter(currentChar)) {
        word += currentChar;
      }

      if (!isLetter(previousChar) || isLastChar) {
        if (word.length > 0) {
          speechMarks.push({
            value: word.toLowerCase(),
            time,
          });
        }

        time = charStartTimesMs[i];
        word = "";
      }

      if (isLetter(currentChar)) {
        word += currentChar;
      }
    }

    return ok(speechMarks);
  }

  normalizedAlignmentFrom(
    responses: ElevenLabsWSResponse[],
    estimatedGapMs: number,
  ): Result<ElevenLabsNormalizedAlignment, never> {
    const normalizedAlignment: ElevenLabsNormalizedAlignment = {
      chars: [],
      charStartTimesMs: [],
    };

    let previousNormalizedAlignmentEndCharMs = 0;

    for (const response of responses) {
      if (!response.isFinal && response.normalizedAlignment !== null) {
        normalizedAlignment.chars = normalizedAlignment.chars.concat(response.normalizedAlignment.chars);
        normalizedAlignment.charStartTimesMs = normalizedAlignment.charStartTimesMs.concat(
          response.normalizedAlignment.charStartTimesMs.map(
            (charStartTimeMs) => charStartTimeMs + previousNormalizedAlignmentEndCharMs,
          ),
        );

        previousNormalizedAlignmentEndCharMs =
          response.normalizedAlignment.charStartTimesMs[response.normalizedAlignment.charStartTimesMs.length - 1] +
          previousNormalizedAlignmentEndCharMs +
          estimatedGapMs;
      }
    }

    return ok(normalizedAlignment);
  }

  audioBufferFrom(responses: ElevenLabsWSResponse[]): Result<Buffer, never> {
    const buffers: Buffer[] = [];

    for (const response of responses) {
      if (!response.isFinal) buffers.push(Buffer.from(response.audio, "base64"));
    }

    return ok(Buffer.concat(buffers));
  }

  generateSpeech(text: string): ResultAsync<Speech, ServiceError | ValidationError | ParseError> {
    return this.client
      .getWebSocketResponses(text)
      .andThen((responses) =>
        Result.combine([
          this.audioBufferFrom(responses),
          this.normalizedAlignmentFrom(responses, 90).andThen(this.speechMarksFrom),
        ]),
      )
      .map<Speech>(([audio, marks]) => ({
        audio,
        marks,
      }));
  }
}

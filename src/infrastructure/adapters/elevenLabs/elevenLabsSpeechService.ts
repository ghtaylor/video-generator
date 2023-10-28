import { NetworkError } from "@core/errors/NetworkError";
import { ParseError } from "@core/errors/ParseError";
import { ValidationError } from "@core/errors/ValidationError";
import { SpeechService } from "@core/speechService";
import { Speech, SpeechMark } from "@domain/Speech";
import { Result, ResultAsync, errAsync, ok } from "neverthrow";
import { ElevenLabsNormalizedAlignment } from "./schema";

export class ElevenLabsSpeechService implements SpeechService {
  speechMarksFrom({ chars, charStartTimesMs }: ElevenLabsNormalizedAlignment): Result<SpeechMark[], never> {
    function isLetter(char: string): boolean {
      return /[A-Za-z]/.test(char);
    }

    const speechMarks: SpeechMark[] = [];

    let word = "";
    let time = 0;

    for (let i = 0; i < chars.length; i++) {
      const currentChar = chars[i];
      const previousChar = chars[i - 1];
      const isLastChar = i === chars.length - 1;

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

  generateSpeech(text: string): ResultAsync<Speech, NetworkError | ValidationError | ParseError> {
    return errAsync(new NetworkError("Not implemented"));
  }
}
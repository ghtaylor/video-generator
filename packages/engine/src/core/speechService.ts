import { Speech } from "@video-generator/domain/Speech";
import { ResultAsync } from "neverthrow";
import { NetworkError } from "@core/errors/NetworkError";
import { ValidationError } from "@core/errors/ValidationError";
import { ParseError } from "@core/errors/ParseError";

export interface SpeechService {
  generateSpeech(text: string): ResultAsync<Speech, NetworkError | ValidationError | ParseError>;
}

import { Speech } from "@video-generator/domain/Speech";
import { ResultAsync } from "neverthrow";
import { ServiceError } from "@core/errors/ServiceError";
import { ValidationError } from "@core/errors/ValidationError";
import { ParseError } from "@core/errors/ParseError";

export interface SpeechService {
  generateSpeech(text: string): ResultAsync<Speech, ServiceError | ValidationError | ParseError>;
}

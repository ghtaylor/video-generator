import { Speech } from "@domain/Speech";
import { ResultAsync } from "neverthrow";
import { NetworkError } from "./errors/NetworkError";
import { ValidationError } from "./errors/ValidationError";

export interface SpeechService {
  generateSpeech(text: string): ResultAsync<Speech, NetworkError | ValidationError>;
}

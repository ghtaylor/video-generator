import { Speech } from "@domain/Speech";
import { ResultAsync } from "neverthrow";
import { NetworkError } from "./errors/NetworkError";
import { UnknownError } from "./errors/UnknownError";

export interface SpeechService {
  generateSpeech(text: string): ResultAsync<Speech, NetworkError | UnknownError>;
}

import { Speech } from "@domain/Speech";
import { Result } from "true-myth";
import { NetworkError } from "./errors/NetworkError";
import { UnknownError } from "./errors/UnknownError";

export interface SpeechService {
  generateSpeech(text: string): Promise<Result<Speech, NetworkError | UnknownError>>;
}

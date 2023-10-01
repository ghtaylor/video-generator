import { Speech } from "@domain/Speech";

export interface SpeechService {
  generateSpeech(text: string): Promise<Speech>;
}

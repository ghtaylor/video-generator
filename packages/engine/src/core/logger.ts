import { Result } from "neverthrow";

export interface Logger {
  info(message: string): void;
  info(message: string, data?: unknown): void;

  error(message: string): void;
  error(message: string, error?: Error): void;

  logResult<T, E extends Error>(result: Result<T, E>, message?: string): void;
}

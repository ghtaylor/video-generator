import { Logger } from "@core/logger";
import { Result } from "neverthrow";
import pino, { Logger as Pino } from "pino";

export class PinoLogger implements Logger {
  constructor(private logger: Pino) {}
  logResult<T, E extends Error>(result: Result<T, E>, message?: string): void {
    if (result.isOk()) {
      this.info(message ?? "OK result received", { result: result.value });
      return;
    }

    this.error(message ?? "Error result received", result.error);
  }

  static build(): PinoLogger {
    return new PinoLogger(pino());
  }

  info(message: string, data?: unknown): void {
    this.logger.info({ data }, message);
  }

  error(message: string, error?: Error): void {
    if (error instanceof Error) {
      this.logger.error(error, message);
      return;
    }

    this.logger.error(message);
  }
}

import { Logger } from "@core/logger";
import winston from "winston";

export class WinstonLogger implements Logger {
  constructor(private readonly logger: winston.Logger) {}

  static build(): Logger {
    const logger = winston.createLogger({
      format: winston.format.printf((info) => {
        const log = {
          level: info.level,
          name: info.name,
          message: info.message,
        };

        return JSON.stringify(log);
      }),
      transports: [new winston.transports.Console()],
    });

    return new WinstonLogger(logger);
  }

  info(message: string): this {
    this.logger.info(message);
    return this;
  }

  error(error: Error): this {
    this.logger.error(error);
    return this;
  }
}

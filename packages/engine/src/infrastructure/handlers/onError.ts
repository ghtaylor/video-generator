import { PinoLogger } from "@infrastructure/adapters/pinoLogger";

export default async (event: unknown): Promise<void> => {
  const logger = PinoLogger.build();

  logger.info("Event received", event);
};

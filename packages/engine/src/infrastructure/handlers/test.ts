import { PinoLogger } from "@infrastructure/adapters/pinoLogger";

export default async (payload: unknown): Promise<void> => {
  const logger = PinoLogger.build();

  logger.info("Received payload", payload);
};

import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { Logger } from "@core/logger";
import { OnErrorUseCase } from "@core/usecases/OnError";
import { EventBridgeProgressReporter } from "@infrastructure/adapters/eventBridgeProgressReporter";
import { PinoLogger } from "@infrastructure/adapters/pinoLogger";

export class OnErrorHandler {
  constructor(
    private readonly useCase: OnErrorUseCase,
    private readonly logger: Logger,
  ) {}

  static build(eventBusName: string): OnErrorHandler {
    const logger = PinoLogger.build();

    const eventBridgeClient = new EventBridgeClient({});
    const eventBridgeProgressReporter = new EventBridgeProgressReporter(eventBridgeClient, eventBusName);

    const useCase = new OnErrorUseCase(eventBridgeProgressReporter);

    return new OnErrorHandler(useCase, logger);
  }

  async handle(): Promise<void> {
    return this.useCase.execute().match(
      () => {
        this.logger.info("OnError use case executed");
      },
      (error) => {
        this.logger.error("Error executing OnError use case", error);
      },
    );
  }
}

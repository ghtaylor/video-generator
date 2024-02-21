import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { Logger } from "@core/logger";
import { OnDoneUseCase } from "@core/usecases/OnDone";
import { EventBridgeProgressReporter } from "@infrastructure/adapters/eventBridgeProgressReporter";
import { PinoLogger } from "@infrastructure/adapters/pinoLogger";
import { EventBus } from "sst/node/event-bus";

export class OnDoneHandler {
  constructor(
    private readonly useCase: OnDoneUseCase,
    private readonly logger: Logger,
  ) {}

  static build(eventBusName: string) {
    const logger = PinoLogger.build();

    const eventBridgeClient = new EventBridgeClient({});
    const eventBridgeProgressReporter = new EventBridgeProgressReporter(eventBridgeClient, eventBusName);

    const useCase = new OnDoneUseCase(eventBridgeProgressReporter);

    return new OnDoneHandler(useCase, logger);
  }

  async handle(): Promise<void> {
    return this.useCase.execute().match(
      () => {
        this.logger.info("OnDone use case executed");
      },
      (error) => {
        this.logger.error("Error executing OnDone use case", error);
      },
    );
  }
}

const handlerInstance = OnDoneHandler.build(EventBus.EventBus.eventBusName);

export default handlerInstance.handle.bind(handlerInstance);

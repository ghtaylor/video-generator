import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { parseJson } from "@common/parseJson";
import { Logger } from "@core/logger";
import { OnErrorUseCase } from "@core/usecases/OnError";
import { EventBridgeProgressReporter } from "@infrastructure/adapters/eventBridgeProgressReporter";
import { PinoLogger } from "@infrastructure/adapters/pinoLogger";
import { BaseSFNPayload } from "@infrastructure/events/sfnPayload";
import { EventBus } from "sst/node/event-bus";

const Payload = BaseSFNPayload;

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

  async handle(payload: unknown): Promise<void> {
    return parseJson(payload, Payload)
      .map(({ executionId }) => executionId)
      .asyncAndThen(this.useCase.execute.bind(this.useCase))
      .match(
        () => {
          this.logger.info("OnError use case executed");
        },
        (error) => {
          this.logger.error("Error executing OnError use case", error);
        },
      );
  }
}

const handlerInstance = OnErrorHandler.build(EventBus.EventBus.eventBusName);

export default handlerInstance.handle.bind(handlerInstance);

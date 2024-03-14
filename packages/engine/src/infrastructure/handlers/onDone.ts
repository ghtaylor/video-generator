import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { parseJson } from "@common/parseJson";
import { Logger } from "@core/logger";
import { OnDoneUseCase } from "@core/usecases/OnDone";
import { EventBridgeEventSender } from "@infrastructure/adapters/eventBridgeEventSender";
import { PinoLogger } from "@infrastructure/adapters/pinoLogger";
import { BaseSFNPayload } from "@infrastructure/events/sfnPayload";
import { RenderedVideo } from "@video-generator/domain/Video";
import { EventBus } from "sst/node/event-bus";

const Payload = BaseSFNPayload.extend({
  renderedVideo: RenderedVideo,
});

export class OnDoneHandler {
  constructor(
    private readonly useCase: OnDoneUseCase,
    private readonly logger: Logger,
  ) {}

  static build(eventBusName: string) {
    const logger = PinoLogger.build();

    const eventBridgeClient = new EventBridgeClient({});
    const eventBridgeExecutionManager = new EventBridgeEventSender(eventBridgeClient, eventBusName);

    const useCase = new OnDoneUseCase(eventBridgeExecutionManager);

    return new OnDoneHandler(useCase, logger);
  }

  async handle(event: unknown): Promise<void> {
    return parseJson(event, Payload)
      .asyncAndThen(({ executionId, renderedVideo }) => this.useCase.execute(executionId, renderedVideo))
      .match(
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

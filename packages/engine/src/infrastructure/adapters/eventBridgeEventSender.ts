import { EventBridgeClient, PutEventsCommand, PutEventsCommandOutput } from "@aws-sdk/client-eventbridge";
import { ServiceError } from "@core/errors/ServiceError";
import { EventSender } from "@core/eventSender";
import { EventName } from "@video-generator/domain/Event";
import { ResultAsync, errAsync, fromPromise, okAsync } from "neverthrow";

export class EventBridgeEventSender implements EventSender {
  constructor(
    private readonly eventBridge: EventBridgeClient,
    private readonly eventBusName: string,
  ) {}

  private sendPutEventsCommand(command: PutEventsCommand): ResultAsync<PutEventsCommandOutput, ServiceError> {
    return fromPromise(
      this.eventBridge.send(command),
      (error) => new ServiceError("Failed to send event", { originalError: error }),
    );
  }

  sendEvent<TEvent>(name: EventName, event: TEvent): ResultAsync<TEvent, ServiceError> {
    const command = new PutEventsCommand({
      Entries: [
        {
          Source: "vidgen.engine",
          DetailType: name,
          Detail: JSON.stringify(event),
          EventBusName: this.eventBusName,
        },
      ],
    });

    return this.sendPutEventsCommand(command).andThen((output) => {
      if (output.FailedEntryCount !== 0) return errAsync(new ServiceError("Failed to send event", { data: output }));

      return okAsync(event);
    });
  }
}

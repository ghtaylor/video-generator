import { EventBridgeClient, PutEventsCommand, PutEventsCommandOutput } from "@aws-sdk/client-eventbridge";
import { ServiceError } from "@core/errors/ServiceError";
import { ProgressReporter } from "@core/progressReporter";
import { Progress } from "@video-generator/domain/Progress";
import { ResultAsync, errAsync, fromPromise, okAsync } from "neverthrow";

export class EventBridgeProgressReporter implements ProgressReporter {
  constructor(
    private readonly eventBridge: EventBridgeClient,
    private readonly eventBusName: string,
  ) {}

  private sendPutEventsCommand(command: PutEventsCommand): ResultAsync<PutEventsCommandOutput, ServiceError> {
    return fromPromise(
      this.eventBridge.send(command),
      (error) => new ServiceError("Failed to report progress", { originalError: error }),
    );
  }

  reportProgress(progress: Progress): ResultAsync<Progress, ServiceError> {
    const command = new PutEventsCommand({
      Entries: [
        {
          Source: "video-generator",
          DetailType: "progressReported",
          Detail: JSON.stringify(progress),
          EventBusName: this.eventBusName,
        },
      ],
    });

    return this.sendPutEventsCommand(command).andThen((output) => {
      if (output.FailedEntryCount !== 0)
        return errAsync(new ServiceError("Failed to report progress", { data: output }));

      return okAsync(progress);
    });
  }
}

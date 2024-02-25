import { EventBridgeClient, PutEventsCommand, PutEventsCommandOutput } from "@aws-sdk/client-eventbridge";
import { ServiceError } from "@core/errors/ServiceError";
import { ExecutionManager } from "@core/executionManager";
import { ExecutionState } from "@video-generator/domain/Execution";
import { ResultAsync, errAsync, fromPromise, okAsync } from "neverthrow";

export class EventBridgeExecutionManager implements ExecutionManager {
  constructor(
    private readonly eventBridge: EventBridgeClient,
    private readonly eventBusName: string,
  ) {}

  private sendPutEventsCommand(command: PutEventsCommand): ResultAsync<PutEventsCommandOutput, ServiceError> {
    return fromPromise(
      this.eventBridge.send(command),
      (error) => new ServiceError("Failed to report execution state", { originalError: error }),
    );
  }

  reportState(state: ExecutionState): ResultAsync<ExecutionState, ServiceError> {
    const command = new PutEventsCommand({
      Entries: [
        {
          Source: "vidgen.engine",
          DetailType: "executionStateChanged",
          Detail: JSON.stringify(state),
          EventBusName: this.eventBusName,
        },
      ],
    });

    return this.sendPutEventsCommand(command).andThen((output) => {
      if (output.FailedEntryCount !== 0)
        return errAsync(new ServiceError("Failed to report execution state", { data: output }));

      return okAsync(state);
    });
  }
}

import { EventBridgeClient, PutEventsCommand, PutEventsCommandOutput } from "@aws-sdk/client-eventbridge";
import { ServiceError } from "@core/errors/ServiceError";
import { Logger } from "@core/logger";
import { ProgressReporter } from "@core/progressReporter";
import { Progress, State } from "@video-generator/domain/Progress";
import { ResultAsync, errAsync, fromPromise, okAsync } from "neverthrow";

export class EventBridgeProgressReporter implements ProgressReporter {
  constructor(
    private readonly eventBridge: EventBridgeClient,
    private readonly eventBusName: string,
    private readonly logger?: Logger,
  ) {}

  private progressFrom(state: State): Progress {
    const PROGRESS_VALUE: Record<State, number> = {
      GENERATING_QUOTE: 0.25,
      GENERATING_SPEECH: 0.5,
      RENDERING_VIDEO: 0.75,
      DONE: 1,
      ERROR: 0,
    } as const;

    return {
      state,
      progress: PROGRESS_VALUE[state],
    };
  }

  private sendPutEventsCommand(command: PutEventsCommand): ResultAsync<PutEventsCommandOutput, ServiceError> {
    return fromPromise(
      this.eventBridge.send(command),
      (error) => new ServiceError("Failed to report progress", { originalError: error }),
    );
  }

  reportProgress(state: State): ResultAsync<Progress, ServiceError> {
    const progress = this.progressFrom(state);

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

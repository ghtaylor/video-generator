import { ServiceError } from "@core/errors/ServiceError";
import { EventSender } from "@core/eventSender";
import { ExecutionState } from "@video-generator/domain/Execution";
import { ResultAsync } from "neverthrow";

export class OnErrorUseCase {
  constructor(private readonly eventSender: EventSender) {}

  execute(executionId: string): ResultAsync<null, ServiceError> {
    return this.eventSender
      .sendEvent<ExecutionState>("executionStateChanged", { executionId, state: "ERROR", progress: 1 })
      .map(() => null);
  }
}

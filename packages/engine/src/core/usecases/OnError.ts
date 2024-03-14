import { ServiceError } from "@core/errors/ServiceError";
import { EventSender } from "@core/eventSender";
import { Execution, ExecutionErrorCause } from "@video-generator/domain/Execution";
import { ResultAsync } from "neverthrow";

export class OnErrorUseCase {
  constructor(private readonly eventSender: EventSender) {}

  execute(executionId: string, cause: ExecutionErrorCause): ResultAsync<null, ServiceError> {
    return this.eventSender
      .sendEvent<Execution>("executionUpdated", { id: executionId, status: "ERROR", progress: 1, cause })
      .map(() => null);
  }
}

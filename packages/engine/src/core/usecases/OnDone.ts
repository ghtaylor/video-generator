import { ServiceError } from "@core/errors/ServiceError";
import { EventSender } from "@core/eventSender";
import { Execution } from "@video-generator/domain/Execution";
import { ResultAsync } from "neverthrow";

export class OnDoneUseCase {
  constructor(private readonly eventSender: EventSender) {}

  execute(executionId: string): ResultAsync<null, ServiceError> {
    return this.eventSender
      .sendEvent<Execution>("executionUpdated", { id: executionId, status: "DONE", progress: 1 })
      .map(() => null);
  }
}

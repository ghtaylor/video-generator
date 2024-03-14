import { ServiceError } from "@core/errors/ServiceError";
import { EventSender } from "@core/eventSender";
import { Execution } from "@video-generator/domain/Execution";
import { RenderedVideo } from "@video-generator/domain/Video";
import { ResultAsync } from "neverthrow";

export class OnDoneUseCase {
  constructor(private readonly eventSender: EventSender) {}

  execute(executionId: string, renderedVideo: RenderedVideo): ResultAsync<null, ServiceError> {
    return this.eventSender
      .sendEvent<Execution>("executionUpdated", {
        id: executionId,
        status: "DONE",
        progress: 1,
        renderedVideo,
      })
      .map(() => null);
  }
}

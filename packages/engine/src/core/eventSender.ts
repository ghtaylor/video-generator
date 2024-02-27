import { EventName } from "@video-generator/domain/Event";
import { ResultAsync } from "neverthrow";
import { ServiceError } from "./errors/ServiceError";

export interface EventSender {
  sendEvent<TEvent>(name: EventName, event: TEvent): ResultAsync<TEvent, ServiceError>;
}

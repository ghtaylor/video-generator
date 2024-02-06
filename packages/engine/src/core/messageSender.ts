import { ResultAsync } from "neverthrow";
import { ServiceError } from "@core/errors/ServiceError";

export interface MessageSender<TMessage> {
  send(message: TMessage): ResultAsync<TMessage, ServiceError>;
}

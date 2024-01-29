import { ResultAsync } from "neverthrow";
import { NetworkError } from "@core/errors/NetworkError";

export interface MessageSender<TMessage> {
  send(message: TMessage): ResultAsync<TMessage, NetworkError>;
}
